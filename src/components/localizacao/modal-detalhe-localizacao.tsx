'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ModalShell } from '@/components/ui/modal-shell';

interface ModalDetalheLocalizacaoProps {
  isOpen: boolean;
  onClose: () => void;
  localizacaoNome: string;
  localizacaoDescricao?: string;
  localizacaoCriadoEm?: string;
}

function formatarData(data?: string) {
  if (!data) return '—';
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

export default function ModalDetalheLocalizacao({
  isOpen,
  onClose,
  localizacaoNome,
  localizacaoDescricao,
  localizacaoCriadoEm,
}: ModalDetalheLocalizacaoProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={99999}
      contentClassName="max-w-lg overflow-visible"
      contentDataTest="modal-detalhe-localizacao"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo do Modal */}
      <div className="px-6 pb-6 space-y-6">
        <div className="text-center pt-4">
          <h2
            className="text-xl font-semibold text-foreground break-words"
            data-test="detalhe-localizacao-nome"
          >
            {localizacaoNome}
          </h2>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Descrição
          </p>
          <p
            className="text-sm text-foreground whitespace-pre-wrap break-words"
            data-test="detalhe-localizacao-descricao"
          >
            {localizacaoDescricao || 'Sem descrição.'}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Criada em
          </p>
          <p className="text-sm text-foreground">
            {formatarData(localizacaoCriadoEm)}
          </p>
        </div>
      </div>
    </ModalShell>
  );

  return createPortal(modalContent, document.body);
}
