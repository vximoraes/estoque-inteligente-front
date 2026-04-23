'use client';

import { Bot } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatPanel } from './ChatPanel';

export function ChatWidget() {
  const { isOpen, abrirChat, fecharChat } = useChatContext();

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          onClick={abrirChat}
          aria-label="Abrir assistente de IA"
          style={{ width: '56px', height: '56px' }}
          className="
            fixed bottom-6 right-6 z-50
            flex items-center justify-center
            rounded-full shrink-0
            bg-[#0f1419] border border-border
            text-white shadow-lg cursor-pointer
            hover:bg-[#1a2332] hover:shadow-xl
            transition-[background-color,box-shadow]
          "
        >
          <Bot size={25} strokeWidth={1.75} />
        </button>
      )}

      {/* Chat panel — centered modal on mobile, fixed bottom-right on desktop */}
      {isOpen && (
        <>
          {/* Backdrop — only on mobile */}
          <div
            className="fixed inset-0 z-50 bg-black/50 sm:hidden"
            onClick={fecharChat}
            aria-hidden="true"
          />
          <div className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:top-auto sm:bottom-6 sm:right-6">
            <ChatPanel />
          </div>
        </>
      )}
    </>
  );
}
