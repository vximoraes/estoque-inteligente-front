'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import type { Mensagem } from '@/types/chat';

interface ChatMessageProps {
  mensagem: Mensagem;
  isStreaming?: boolean;
}

export function ChatMessage({
  mensagem,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = mensagem.role === 'user';
  const isError = mensagem.role === 'error';
  const [copiado, setCopiado] = useState(false);

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

  if (isError) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[90%] px-3.5 py-2.5 rounded-tr-md rounded-br-md rounded-tl-md rounded-bl-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {mensagem.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group/msg flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}
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
        ) : isStreaming && !mensagem.content ? (
          <span className="flex items-center gap-1 py-1">
            <span
              className="rounded-full bg-muted-foreground animate-dot-pulse"
              style={{
                width: '4px',
                height: '4px',
                minWidth: '4px',
                flexShrink: 0,
                animationDelay: '0s',
              }}
            />
            <span
              className="rounded-full bg-muted-foreground animate-dot-pulse"
              style={{
                width: '4px',
                height: '4px',
                minWidth: '4px',
                flexShrink: 0,
                animationDelay: '0.2s',
              }}
            />
            <span
              className="rounded-full bg-muted-foreground animate-dot-pulse"
              style={{
                width: '4px',
                height: '4px',
                minWidth: '4px',
                flexShrink: 0,
                animationDelay: '0.4s',
              }}
            />
          </span>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {mensagem.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {podeCopiar && (
        <button
          onClick={handleCopy}
          aria-label="Copiar mensagem"
          title="Copiar"
          data-test="chat-copiar-mensagem"
          className="
            relative mt-1 p-1.5 rounded-md flex-shrink-0
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
  );
}
