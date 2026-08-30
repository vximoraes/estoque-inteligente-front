'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Emprestimo } from '@/types/emprestimos';
import { getEmprestimoNome } from '@/lib/emprestimo';
import { ModalShell } from '@/components/ui/modal-shell';

interface ModalDetalhesEmprestimoProps {
  isOpen: boolean;
  onClose: () => void;
  emprestimo: Emprestimo;
}

const STATUS_BG: Record<string, string> = {
  Ativo: 'var(--status-success-bg)',
  Atrasado: 'var(--status-danger-bg)',
  Devolvido: 'var(--muted)',
};

const STATUS_TEXT: Record<string, string> = {
  Ativo: 'var(--status-success-text)',
  Atrasado: 'var(--status-danger-text)',
  Devolvido: 'var(--muted-foreground)',
};

function formatarData(data?: string | null) {
  if (!data) return '-';
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ModalDetalhesEmprestimo({
  isOpen,
  onClose,
  emprestimo,
}: ModalDetalhesEmprestimoProps) {
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
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const temObsEmprestimo =
    emprestimo.observacoes_emprestimo &&
    emprestimo.observacoes_emprestimo.trim() !== '';
  const temObsDevolucao =
    emprestimo.observacoes_devolucao &&
    emprestimo.observacoes_devolucao.trim() !== '';

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={99999}
      data-test="modal-detalhes-emprestimo"
      contentClassName="max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-border shrink-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          title="Fechar"
          data-test="modal-detalhes-emprestimo-close"
        >
          <X size={20} />
        </button>
        <div className="text-center px-8">
          <h2 className="text-xl font-semibold text-foreground">
            {getEmprestimoNome(emprestimo)}
          </h2>
          <div className="flex justify-center mt-2">
            <span
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium whitespace-nowrap"
              style={{
                color: STATUS_TEXT[emprestimo.status],
                backgroundColor: STATUS_BG[emprestimo.status],
              }}
            >
              {emprestimo.status}
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 space-y-5 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Localização
            </label>
            <p className="text-base text-foreground break-words">
              {emprestimo.localizacao?.nome || '-'}
            </p>
          </div>
          <div className="min-w-0">
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Solicitante
            </label>
            <p className="text-base text-foreground break-words">
              {emprestimo.solicitante_nome || '-'}
            </p>
          </div>
          <div className="min-w-0">
            <label className="text-base font-medium text-muted-foreground block mb-2">
              E-mail do solicitante
            </label>
            <p className="text-base text-foreground break-words">
              {emprestimo.solicitante_email || '-'}
            </p>
          </div>
          <div className="min-w-0">
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Responsável pelo registro
            </label>
            <p className="text-base text-foreground break-words">
              {emprestimo.usuario_responsavel?.nome || '-'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t grid grid-cols-3 gap-4">
          <div>
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Qtd. emprestada
            </label>
            <p className="text-base text-foreground">
              {emprestimo.quantidade_emprestada}
            </p>
          </div>
          <div>
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Qtd. devolvida
            </label>
            <p className="text-base text-foreground">
              {emprestimo.quantidade_devolvida}
            </p>
          </div>
          <div>
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Qtd. em aberto
            </label>
            <p className="text-base text-foreground">
              {emprestimo.quantidade_aberta}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Data do empréstimo
            </label>
            <p className="text-base text-foreground">
              {formatarData(emprestimo.data_saida)}
            </p>
          </div>
          <div>
            <label className="text-base font-medium text-muted-foreground block mb-2">
              Data prevista de devolução
            </label>
            <p className="text-base text-foreground">
              {formatarData(emprestimo.data_prevista_devolucao)}
            </p>
          </div>
          {emprestimo.data_devolucao_total && (
            <div>
              <label className="text-base font-medium text-muted-foreground block mb-2">
                Data da devolução total
              </label>
              <p className="text-base text-foreground">
                {formatarData(emprestimo.data_devolucao_total)}
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <label className="text-base font-medium text-muted-foreground block mb-2">
            Observações do empréstimo
          </label>
          <p className="text-base text-foreground">
            {temObsEmprestimo ? emprestimo.observacoes_emprestimo : '-'}
          </p>
        </div>

        <div>
          <label className="text-base font-medium text-muted-foreground block mb-2">
            Observações da devolução
          </label>
          <p className="text-base text-foreground">
            {temObsDevolucao ? emprestimo.observacoes_devolucao : '-'}
          </p>
        </div>

        {(emprestimo.createdAt || emprestimo.updatedAt) && (
          <div className="pt-4 border-t grid grid-cols-2 gap-4">
            {emprestimo.createdAt && (
              <div>
                <label className="text-base font-medium text-muted-foreground block mb-1">
                  Criado em
                </label>
                <p className="text-base text-muted-foreground">
                  {formatarData(emprestimo.createdAt)}
                </p>
              </div>
            )}
            {emprestimo.updatedAt && (
              <div>
                <label className="text-base font-medium text-muted-foreground block mb-1">
                  Atualizado em
                </label>
                <p className="text-base text-muted-foreground">
                  {formatarData(emprestimo.updatedAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
