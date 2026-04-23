'use client';

import { useRef, useEffect, useState } from 'react';
import { X, Bot, MessageSquare, History, SquarePen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatContext } from '@/contexts/ChatContext';
import { useSession } from '@/hooks/use-session';
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

const SUGESTOES = [
  'Itens abaixo do estoque mínimo',
  'Empréstimos em atraso',
  'Item com mais movimentações',
  'Resumo do estoque atual',
];

export function ChatPanel() {
  const { fecharChat, conversaAtiva, selecionarConversa, isStreaming, setIsStreaming } =
    useChatContext();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const firstName = user?.name?.split(' ')[0] ?? null;

  const [inputValue, setInputValue] = useState('');
  const [mensagensLocais, setMensagensLocais] = useState<Mensagem[]>([]);
  const [pendingNewConversa, setPendingNewConversa] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);
  const loadedConversaIdRef = useRef<string | null>(null);

  const { data: conversasData, isLoading: loadingConversas } = useConversas();
  const { data: conversaCarregada } = useConversa(conversaAtiva?._id ?? null);
  const createConversa = useCreateConversa();
  const deleteConversa = useDeleteConversa();

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  });

  useEffect(() => {
    if (!conversaCarregada) return;
    if (isStreamingRef.current) return;
    // Só sincroniza quando navegar para uma conversa diferente da atual
    if (loadedConversaIdRef.current === conversaCarregada._id) return;
    loadedConversaIdRef.current = conversaCarregada._id;
    const serverMsgs = conversaCarregada.mensagens ?? [];
    if (serverMsgs.length > 0) {
      setMensagensLocais(serverMsgs);
    }
  }, [conversaCarregada]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagensLocais]);

  const handleSelectConversa = (resumo: ConversaResumo) => {
    loadedConversaIdRef.current = null; // força re-sync ao navegar
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

  const handleSend = async (overrideContent?: string) => {
    const content = (overrideContent ?? inputValue).trim();
    if (!content || isStreaming) return;
    if (!conversaAtiva && !pendingNewConversa) return;

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
        const nova = await createConversa.mutateAsync(content);
        selecionarConversa({ ...nova, mensagens: [] });
        setPendingNewConversa(false);
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
        w-full sm:w-[540px] h-[55vh] sm:h-[560px]
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
            <div className="flex flex-col items-center justify-center flex-1 gap-5 px-4 pb-4">
              <div className="flex flex-col items-center gap-1">
                <div className="h-2.5 rounded-full bg-muted animate-pulse w-16 mb-1" />
                <div className="h-6 rounded bg-muted animate-pulse w-44" />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="h-9 rounded border border-border bg-muted animate-pulse w-full" />
                <div className="h-9 rounded border border-border bg-muted animate-pulse w-full" />
                <div className="h-9 rounded border border-border bg-muted animate-pulse w-full" />
                <div className="h-9 rounded border border-border bg-muted animate-pulse w-full" />
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
                {mensagensLocais.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-5 px-2 pb-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                      {firstName && (
                        <p className="text-xs text-muted-foreground tracking-wide uppercase">
                          {firstName}
                        </p>
                      )}
                      <p className="font-sans text-2xl font-bold text-foreground leading-tight">
                        Como posso ajudar?
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      {SUGESTOES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSend(s)}
                          className="
                            w-full text-left px-3 py-2 text-sm rounded border border-border
                            bg-muted/50 text-muted-foreground
                            hover:bg-muted hover:text-foreground hover:border-[#306FCC]/40
                            transition-colors cursor-pointer
                          "
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  mensagensLocais.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      mensagem={msg}
                      isStreaming={isStreaming && i === mensagensLocais.length - 1}
                    />
                  ))
                )}
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
