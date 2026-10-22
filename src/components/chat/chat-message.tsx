'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Bot } from 'lucide-react';
import type { Mensagem } from '@/types/chat';
import { formatarDataHora } from '@/lib/datas';
import { useFusoAtual } from '@/hooks/use-fuso-horario';

const ESPERA_ATE_AVISAR_MS = 10_000;

function linkInterno(href: string | undefined): href is string {
  return Boolean(href?.startsWith('/') && !href.startsWith('//'));
}

const componentesMarkdown: Components = {
  img: ({ alt }) => (alt ? <span>{alt}</span> : null),
  a: ({ href, children }) =>
    linkInterno(href) ? <a href={href}>{children}</a> : <span>{children}</span>,
};

interface ChatMessageProps {
  mensagem: Mensagem;
  isStreaming?: boolean;
}

export function ChatMessage({
  mensagem,
  isStreaming = false,
}: ChatMessageProps) {
  useFusoAtual();
  const isUser = mensagem.role === 'user';
  const isError = mensagem.role === 'error';
  const [copiado, setCopiado] = useState(false);
  const aguardando = isStreaming && !mensagem.content;
  const [demorando, setDemorando] = useState(false);

  useEffect(() => {
    if (!aguardando) {
      setDemorando(false);
      return;
    }
    const timer = setTimeout(() => setDemorando(true), ESPERA_ATE_AVISAR_MS);
    return () => clearTimeout(timer);
  }, [aguardando]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mensagem.content);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (permissão/contexto não seguro), ignora silenciosamente
    }
  };

  const podeCopiar = !isStreaming && mensagem.content.length > 0;
  const dataHora = mensagem.timestamp
    ? formatarDataHora(mensagem.timestamp, '')
    : '';

  if (isError) {
    return (
      <div className="flex justify-start mb-3" data-test="chat-mensagem-erro">
        <div className="max-w-[90%] px-3.5 py-2.5 rounded-tr-md rounded-br-md rounded-tl-md rounded-bl-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {mensagem.content}
        </div>
      </div>
    );
  }

  if (!isUser && aguardando) {
    return (
      <div
        className="mb-3 px-1 py-1 text-sm"
        data-test="chat-mensagem-assistente"
      >
        <div
          data-test="chat-aguardando"
          role="status"
          className="flex items-center gap-2 leading-5"
        >
          <Bot
            aria-hidden
            size={18}
            strokeWidth={2}
            className="block shrink-0 text-[var(--ei-accent)] animate-pulsar motion-reduce:animate-none"
          />
          <span
            data-test="chat-etapa"
            className="bg-[linear-gradient(90deg,var(--muted-foreground)_35%,color-mix(in_oklab,var(--foreground)_40%,var(--muted-foreground))_50%,var(--muted-foreground)_65%)] bg-[length:200%_100%] bg-clip-text text-transparent animate-brilho motion-reduce:animate-none"
          >
            {mensagem.etapa ?? 'Pensando…'}
          </span>
        </div>
        {demorando && (
          <span className="block text-xs text-muted-foreground mt-1 pl-[26px]">
            O modelo está mais lento que o normal, a resposta ainda vem.
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group/msg flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}
      data-test={isUser ? 'chat-mensagem-usuario' : 'chat-mensagem-assistente'}
    >
      <div
        className={`
          ${isUser ? 'max-w-[80%]' : 'max-w-[90%]'} px-3.5 py-2.5 text-base leading-relaxed
          ${
            isUser
              ? 'bg-[var(--ei-accent)] text-ei-accent-foreground rounded-tl-md rounded-bl-md rounded-tr-md rounded-br-md'
              : 'bg-card border border-border text-foreground rounded-tr-md rounded-br-md rounded-tl-md rounded-bl-md'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{mensagem.content}</p>
        ) : (
          <div
            className="
              prose prose-base dark:prose-invert max-w-none
              prose-p:my-1 prose-p:leading-relaxed
              prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
              prose-h2:text-base prose-h3:text-base
              prose-ul:my-1 prose-ul:pl-4
              prose-ol:my-1 prose-ol:pl-4
              prose-li:my-0.5
              [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse
              prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-2 prose-th:py-1 prose-th:font-semibold prose-th:whitespace-nowrap
              prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1 prose-td:whitespace-nowrap
              prose-code:text-[var(--ei-accent)] prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:text-xs prose-pre:overflow-x-auto
              prose-strong:font-semibold prose-strong:text-foreground
              prose-a:text-[var(--ei-accent)] prose-a:no-underline hover:prose-a:underline
            "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={componentesMarkdown}
            >
              {mensagem.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <div
        className={`mt-1 flex items-center gap-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {dataHora && (
          <time
            dateTime={mensagem.timestamp}
            data-test="chat-mensagem-data-hora"
            className="text-xs text-muted-foreground"
          >
            {dataHora}
          </time>
        )}
        {podeCopiar && (
          <button
            onClick={handleCopy}
            aria-label="Copiar mensagem"
            title="Copiar"
            data-test="chat-copiar-mensagem"
            className="
            relative p-1.5 rounded-md flex-shrink-0
            text-foreground opacity-0 group-hover/msg:opacity-100
            hover:bg-muted transition-all duration-200 ease-out cursor-pointer
          "
          >
            <span className="relative block w-4 h-4">
              <Copy
                className={`absolute inset-0 w-4 h-4 transition-all duration-200 ease-out ${
                  copiado
                    ? 'opacity-0 scale-50 -rotate-45'
                    : 'opacity-100 scale-100 rotate-0'
                }`}
              />
              <Check
                className={`absolute inset-0 w-4 h-4 transition-all duration-200 ease-out ${
                  copiado
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-50 rotate-45'
                }`}
              />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
