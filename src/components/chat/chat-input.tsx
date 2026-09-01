'use client';

import { useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  placeholder = 'Pergunte sobre o estoque...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) {
        onSend();
      }
    }
  };

  const canSend = !isStreaming && value.trim().length > 0;
  const proximoDoLimite = value.length > 1800;

  return (
    <div className="flex items-end gap-2 p-3 border-t border-border bg-background">
      <div className="flex-1 flex flex-col gap-1">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={2000}
          className="
            w-full resize-none rounded-md border border-border
            bg-muted px-3 py-2.5 text-base
            text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-1 focus:ring-[var(--ei-accent)]
            transition-[height] overflow-hidden
          "
        />
        {proximoDoLimite && (
          <span className="text-xs text-muted-foreground self-end">
            {value.length}/2000
          </span>
        )}
      </div>
      {isStreaming ? (
        <button
          onClick={onStop}
          aria-label="Parar resposta"
          title="Parar"
          className="
            shrink-0 flex items-center justify-center
            w-11 h-11 rounded-md cursor-pointer
            bg-[var(--ei-accent)] text-ei-accent-foreground
            hover:bg-[var(--ei-accent-hover)] transition-colors
          "
        >
          <Square size={14} strokeWidth={2} fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={() => onSend()}
          disabled={!canSend}
          aria-label="Enviar mensagem"
          className="
            shrink-0 flex items-center justify-center
            w-11 h-11 rounded-md
            bg-[var(--ei-accent)] text-ei-accent-foreground
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:cursor-pointer
            hover:bg-[var(--ei-accent-hover)] transition-colors
          "
        >
          <Send size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
