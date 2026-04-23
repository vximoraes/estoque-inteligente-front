'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Mensagem } from '@/types/chat';

interface ChatMessageProps {
  mensagem: Mensagem;
  isStreaming?: boolean;
}

export function ChatMessage({ mensagem, isStreaming = false }: ChatMessageProps) {
  const isUser = mensagem.role === 'user';
  const isError = mensagem.role === 'error';

  if (isError) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[90%] px-3.5 py-2.5 rounded-tr-lg rounded-br-lg rounded-tl-sm rounded-bl-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {mensagem.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`
          ${isUser ? 'max-w-[80%]' : 'max-w-[90%]'} px-3.5 py-2.5 text-base leading-relaxed
          ${
            isUser
              ? 'bg-[#0f1419] text-white rounded-tl-lg rounded-bl-lg rounded-tr-sm rounded-br-lg'
              : 'bg-card border border-border text-foreground rounded-tr-lg rounded-br-lg rounded-tl-sm rounded-bl-lg'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{mensagem.content}</p>
        ) : isStreaming && !mensagem.content ? (
          <span className="flex items-center gap-1 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-[chat-dot-bounce_1.2s_ease-in-out_infinite] [animation-delay:-0.4s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-[chat-dot-bounce_1.2s_ease-in-out_infinite] [animation-delay:-0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-[chat-dot-bounce_1.2s_ease-in-out_infinite]" />
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
              prose-code:text-[#306FCC] prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded prose-pre:text-xs prose-pre:overflow-x-auto
              prose-strong:font-semibold prose-strong:text-foreground
              prose-a:text-[#306FCC] prose-a:no-underline hover:prose-a:underline
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {mensagem.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
