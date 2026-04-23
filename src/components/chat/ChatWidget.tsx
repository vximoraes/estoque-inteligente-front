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
          className="
            fixed bottom-6 right-6 z-50
            flex items-center justify-center
            w-15 h-15 rounded-full
            bg-[#0f1419] border border-border
            text-white shadow-lg cursor-pointer
            hover:bg-[#1a2332] hover:shadow-xl
            transition-[background-color,box-shadow]
          "
        >
          <Bot size={25} strokeWidth={1.75} />
        </button>
      )}

      {/* Chat panel — fixed overlay, bottom-right */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatPanel />
        </div>
      )}
    </>
  );
}
