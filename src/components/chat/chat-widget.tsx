'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatPanel } from './chat-panel';

const ANIMATION_DURATION = 200;

export function ChatWidget() {
  const { isOpen, abrirChat, fecharChat, limparConversa } = useChatContext();
  const pathname = usePathname();
  const [renderPanel, setRenderPanel] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setRenderPanel(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = setTimeout(() => {
      setRenderPanel(false);
      limparConversa();
    }, ANIMATION_DURATION);
    return () => clearTimeout(timeout);
  }, [isOpen, limparConversa]);

  if (pathname?.endsWith('/adicionar')) {
    return null;
  }

  return (
    <>
      {/* Floating toggle button */}
      {!renderPanel && (
        <button
          onClick={abrirChat}
          aria-label="Abrir assistente de IA"
          style={{ width: '52px', height: '52px' }}
          className={`
            fixed bottom-6 right-6 z-50
            flex items-center justify-center
            rounded-full shrink-0
            bg-[var(--ei-accent)] border border-border
            text-ei-accent-foreground shadow-lg cursor-pointer
            hover:bg-[var(--ei-accent-hover)] hover:shadow-xl
            transition-[background-color,box-shadow]
            animate-in fade-in-0 zoom-in-95 duration-200
          `}
        >
          <Bot size={24} strokeWidth={1.75} className="-translate-y-px" />
        </button>
      )}

      {renderPanel && (
        <>
          <div
            className={`fixed inset-0 z-50 bg-black/50 sm:hidden transition-opacity duration-200 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={fecharChat}
            aria-hidden="true"
          />
          <div
            className={`fixed z-50 inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 transition-opacity duration-200 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChatPanel />
          </div>
        </>
      )}
    </>
  );
}
