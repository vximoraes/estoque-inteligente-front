'use client';

import { Trash2, MessageSquare } from 'lucide-react';
import type { ConversaResumo } from '@/types/chat';
import {
  diasDeCalendarioDesde,
  formatarDiaMes,
  formatarHora,
} from '@/lib/datas';
import { useFusoAtual } from '@/hooks/use-fuso-horario';

interface ConversasListProps {
  conversas: ConversaResumo[];
  conversaAtivaId: string | null;
  isLoading: boolean;
  onSelectConversa: (conversa: ConversaResumo) => void;
  onRequestDelete: (id: string) => void;
}

function formatDate(isoString: string): string {
  const diffDays = diasDeCalendarioDesde(isoString);
  if (diffDays === null) return '';
  if (diffDays <= 0) return formatarHora(isoString);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatarDiaMes(isoString);
}

export function ConversasList({
  conversas,
  conversaAtivaId,
  isLoading,
  onSelectConversa,
  onRequestDelete,
}: ConversasListProps) {
  useFusoAtual();
  return (
    <div className="flex flex-col h-full w-full bg-card shrink-0">
      {/* Header */}
      <div className="flex items-center px-3 py-2.5 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Conversas
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            Carregando...
          </div>
        )}
        {!isLoading && conversas.length === 0 && (
          <div className="px-3 py-4 flex flex-col items-center gap-2 text-center">
            <MessageSquare
              size={20}
              className="text-muted-foreground opacity-40"
            />
            <span className="text-xs text-muted-foreground">
              Nenhuma conversa
            </span>
          </div>
        )}
        {conversas.map((conversa) => {
          const isActive = conversa._id === conversaAtivaId;

          return (
            <div
              key={conversa._id}
              className={`
                group flex items-start gap-1.5 px-3 py-2 cursor-pointer
                transition-colors
                ${isActive ? 'bg-[var(--ei-accent)]/10' : 'hover:bg-muted'}
              `}
              onClick={() => onSelectConversa(conversa)}
              data-test="chat-conversa-item"
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate leading-snug ${isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}
                >
                  {conversa.titulo}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(conversa.atualizada_em)}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete(conversa._id);
                }}
                aria-label="Excluir conversa"
                data-test="chat-excluir-conversa"
                className="
                  shrink-0 opacity-0 group-hover:opacity-100
                  flex items-center justify-center w-5 h-5 rounded-md
                  text-muted-foreground hover:text-red-500
                  transition-all cursor-pointer
                "
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
