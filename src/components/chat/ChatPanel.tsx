'use client';

import { useRef, useEffect, useState } from 'react';
import { X, Bot, MessageSquare, History, SquarePen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConversasList } from './ConversasList';
import {
  useConversas,
  useConversa,
  useCreateConversa,
  useDeleteConversa,
  sendMessage,
} from '@/hooks/useChat';
import type { ConversaResumo, Mensagem } from '@/types/chat';

export function ChatPanel() {
  const { fecharChat, conversaAtiva, selecionarConversa, isStreaming, setIsStreaming } =
    useChatContext();
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState('');
  const [mensagensLocais, setMensagensLocais] = useState<Mensagem[]>([]);
  const [pendingNewConversa, setPendingNewConversa] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  const { data: conversasData, isLoading: loadingConversas } = useConversas();
  const { data: conversaCarregada } = useConversa(conversaAtiva?._id ?? null);
  const createConversa = useCreateConversa();
  const deleteConversa = useDeleteConversa();

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  });

  useEffect(() => {
    if (conversaCarregada && !isStreamingRef.current) {
      setMensagensLocais(conversaCarregada.mensagens ?? []);
    }
  }, [conversaCarregada]);

  useEffect(() => {
    if (loadingConversas) return;
    if (conversaAtiva) return;
    const conversas = conversasData?.docs ?? [];
    if (conversas.length > 0) {
      selecionarConversa({ ...conversas[0], mensagens: [] });
    } else {
      setPendingNewConversa(true);
    }
  }, [loadingConversas, conversasData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagensLocais]);

  const handleSelectConversa = (resumo: ConversaResumo) => {
    setPendingNewConversa(false);
    selecionarConversa({ ...resumo, mensagens: [] });
  };

  const handleNewConversa = () => {
    selecionarConversa(null as any);
    setMensagensLocais([]);
    setPendingNewConversa(true);
  };

  const handleDeleteConversa = async (id: string) => {
    setConfirmDeleteId(null);
    await deleteConversa.mutateAsync(id);
    if (conversaAtiva?._id === id) {
      selecionarConversa(null as any);
      setMensagensLocais([]);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;
    if (!conversaAtiva && !pendingNewConversa) return;

    const content = inputValue.trim();
    setInputValue('');

    const userMsg: Mensagem = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg: Mensagem = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMensagensLocais((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    let targetId: string;
    try {
      if (pendingNewConversa || !conversaAtiva) {
        setPendingNewConversa(false);
        const nova = await createConversa.mutateAsync(content);
        selecionarConversa({ ...nova, mensagens: [] });
        targetId = nova._id;
      } else {
        targetId = conversaAtiva._id;
      }
    } catch {
      setIsStreaming(false);
      setMensagensLocais((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        return [...prev.slice(0, -1), { ...last, role: 'error' as const, content: 'Não foi possível processar sua mensagem. Tente novamente.' }];
      });
      return;
    }

    try {
      await sendMessage(targetId, content, {
        onToken: (chunk) => {
          setMensagensLocais((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last.role !== 'assistant') return prev;
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          });
        },
        onDone: () => {
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ['conversa', targetId] });
          queryClient.invalidateQueries({ queryKey: ['conversas'] });
        },
        onError: (err) => {
          setIsStreaming(false);
          setMensagensLocais((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last.role !== 'assistant') return prev;
            return [
              ...prev.slice(0, -1),
              { ...last, role: 'error' as const, content: err },
            ];
          });
        },
      });
    } catch {
      setIsStreaming(false);
    }
  };

  const conversas = conversasData?.docs ?? [];

  return (
    <div
      className="
        relative flex flex-col bg-background border border-border
        rounded overflow-hidden
        w-[540px] h-[560px]
        shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.12)]
      "
    >
      {/* Delete confirmation popup */}
      {confirmDeleteId && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
          <div className="bg-background border border-border rounded shadow-lg px-5 py-4 flex flex-col gap-3 w-64">
            <p className="text-sm font-medium text-foreground">Excluir conversa?</p>
            <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteConversa(confirmDeleteId)}
                className="px-3 py-1.5 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Bot size={18} className="text-[#306FCC]" strokeWidth={2} />
        <span className="text-base font-semibold text-foreground tracking-tight flex-1">
          Assistente de Estoque
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { handleNewConversa(); setShowHistory(false); }}
            aria-label="Nova conversa"
            className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <SquarePen size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowHistory((v) => !v)}
            aria-label="Histórico de conversas"
            className={`flex items-center justify-center w-7 h-7 rounded transition-colors cursor-pointer ${
              showHistory ? 'text-[#306FCC] bg-[#306FCC]/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <History size={16} strokeWidth={2} />
          </button>
          <button
            onClick={fecharChat}
            aria-label="Fechar chat"
            className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* History full overlay */}
        <div
          className={`
            absolute inset-0 z-20
            transition-[opacity,visibility] duration-200
            ${showHistory ? 'opacity-100 visible' : 'opacity-0 invisible'}
          `}
        >
          <ConversasList
            conversas={conversas}
            conversaAtivaId={conversaAtiva?._id ?? null}
            isLoading={loadingConversas}
            onSelectConversa={(c) => { handleSelectConversa(c); setShowHistory(false); }}
            onRequestDelete={setConfirmDeleteId}
          />
        </div>

        {/* Messages area - full width */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {loadingConversas ? (
            <div className="flex flex-col flex-1 px-4 py-3">
              <div className="bg-card border border-border rounded-lg px-4 py-3 max-w-[85%] flex flex-col gap-2">
                <div className="h-2 rounded-full bg-muted animate-pulse w-40" />
                <div className="h-2 rounded-full bg-muted animate-pulse w-28" />
              </div>
            </div>
          ) : !conversaAtiva && !pendingNewConversa ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center">
              <MessageSquare size={28} className="text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">
                Selecione ou inicie uma nova conversa
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {mensagensLocais.length === 0 && (
                  <ChatMessage
                    mensagem={{
                      role: 'assistant',
                      content: 'Olá! No que posso te ajudar hoje?',
                      timestamp: new Date().toISOString(),
                    }}
                  />
                )}
                {mensagensLocais.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    mensagem={msg}
                    isStreaming={isStreaming && i === mensagensLocais.length - 1}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                isStreaming={isStreaming}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
