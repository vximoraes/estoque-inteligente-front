'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Conversa, Mensagem } from '@/types/chat';

interface ChatContextValue {
  isOpen: boolean;
  conversaAtiva: Conversa | null;
  mensagensLocais: Mensagem[];
  isStreaming: boolean;
  abrirChat: () => void;
  fecharChat: () => void;
  selecionarConversa: (conversa: Conversa | null) => void;
  adicionarMensagem: (mensagem: Mensagem) => void;
  atualizarUltimaResposta: (chunk: string) => void;
  setIsStreaming: (value: boolean) => void;
  limparConversa: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [mensagensLocais, setMensagensLocais] = useState<Mensagem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const abrirChat = useCallback(() => setIsOpen(true), []);
  const fecharChat = useCallback(() => setIsOpen(false), []);

  const selecionarConversa = useCallback((conversa: Conversa | null) => {
    setConversaAtiva(conversa);
    setMensagensLocais(conversa?.mensagens ?? []);
  }, []);

  const adicionarMensagem = useCallback((mensagem: Mensagem) => {
    setMensagensLocais((prev) => [...prev, mensagem]);
  }, []);

  const atualizarUltimaResposta = useCallback((chunk: string) => {
    setMensagensLocais((prev) => {
      if (prev.length === 0) return prev;
      const ultima = prev[prev.length - 1];
      if (ultima.role !== 'assistant') return prev;
      return [...prev.slice(0, -1), { ...ultima, content: ultima.content + chunk }];
    });
  }, []);

  const limparConversa = useCallback(() => {
    setConversaAtiva(null);
    setMensagensLocais([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        conversaAtiva,
        mensagensLocais,
        isStreaming,
        abrirChat,
        fecharChat,
        selecionarConversa,
        adicionarMensagem,
        atualizarUltimaResposta,
        setIsStreaming,
        limparConversa,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
