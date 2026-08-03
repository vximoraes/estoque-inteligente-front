'use client';

import { useRef, useEffect, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) {
        onSend();
      }
    }
  };

  const canSend = !isStreaming && value.trim().length > 0;

  return (
    <div className="flex items-end gap-2 p-3 border-t border-border bg-background">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
        placeholder={placeholder}
        className="
          flex-1 resize-none rounded-md border border-border
          bg-muted px-3 py-2.5 text-base
          text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-1 focus:ring-[var(--ei-accent)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-[height] overflow-hidden
        "
      />
      <button
        onClick={onSend}
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
    </div>
  );
}
