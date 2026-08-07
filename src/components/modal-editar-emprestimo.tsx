'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { put, patch } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';
import { Emprestimo } from '@/types/emprestimos';

interface ModalEditarEmprestimoProps {
  isOpen: boolean;
  onClose: () => void;
  emprestimo: Emprestimo;
  onSuccess?: () => void;
}

export default function ModalEditarEmprestimo({
  isOpen,
  onClose,
  emprestimo,
  onSuccess,
}: ModalEditarEmprestimoProps) {
  const queryClient = useQueryClient();

  const [solicitante, setSolicitante] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [observacoesDevolucao, setObservacoesDevolucao] = useState('');
  const [showConfirmDesfazer, setShowConfirmDesfazer] = useState(false);
  const dataPrevistaOriginalRef = useRef('');

  useEffect(() => {
    if (!isOpen) return;
    setSolicitante(emprestimo.solicitante_nome || '');
    const dp = emprestimo.data_prevista_devolucao
      ? new Date(emprestimo.data_prevista_devolucao).toISOString().slice(0, 16)
      : '';
    setDataPrevista(dp);
    dataPrevistaOriginalRef.current = dp;
    setObservacoes(emprestimo.observacoes_emprestimo || '');
    setObservacoesDevolucao(emprestimo.observacoes_devolucao || '');
    setShowConfirmDesfazer(false);
  }, [isOpen, emprestimo]);

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

  const editarMutation = useMutation({
    mutationFn: async () => {
      return await put(`/emprestimos/${emprestimo._id}`, {
        solicitante_nome: solicitante.trim() || undefined,
        data_prevista_devolucao:
          dataPrevista !== dataPrevistaOriginalRef.current
            ? dataPrevista || undefined
            : undefined,
        observacoes_emprestimo: observacoes.trim() || undefined,
        observacoes_devolucao:
          emprestimo.quantidade_devolvida > 0
            ? observacoesDevolucao.trim() || undefined
            : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      toast.success('Empréstimo atualizado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const msg =
        error?.errors?.[0]?.message ||
        error?.message ||
        'Erro ao atualizar empréstimo.';
      toast.error(msg, { position: 'bottom-right', autoClose: 5000 });
    },
  });

  const desfazerDevolucaoMutation = useMutation({
    mutationFn: async () => {
      return await patch(
        `/emprestimos/${emprestimo._id}/desfazer-devolucao`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      toast.success('Devolução desfeita com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const msg =
        error?.errors?.[0]?.message ||
        error?.message ||
        'Erro ao desfazer devolução.';
      toast.error(msg, { position: 'bottom-right', autoClose: 5000 });
      setShowConfirmDesfazer(false);
    },
  });

  const handleSalvar = () => {
    if (solicitante.trim().length < 3) {
      toast.error('Nome do solicitante deve ter no mínimo 3 caracteres.', {
        position: 'bottom-right',
        autoClose: 4000,
      });
      return;
    }
    editarMutation.mutate();
  };

  const isPending = editarMutation.isPending;

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={99999}
      contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
        >
          <X size={20} className="text-muted-foreground" />
        </button>
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Editar Empréstimo
          </h2>
          <p className="text-sm text-muted-foreground">
            {emprestimo.item?.nome || 'Item'}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {emprestimo.quantidade_aberta <= 0 && (
          <div className="bg-muted/50 border border-border rounded-md p-3 text-sm text-muted-foreground">
            Este empréstimo já foi devolvido
            {emprestimo.data_devolucao_total
              ? ` em ${new Date(emprestimo.data_devolucao_total).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : ''}
            .
          </div>
        )}

        {/* Solicitante */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Solicitante <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={solicitante}
            onChange={(e) => setSolicitante(e.target.value)}
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
          />
        </div>

        {/* Data prevista */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Data prevista de devolução
          </label>
          <input
            type="datetime-local"
            value={dataPrevista}
            onChange={(e) => setDataPrevista(e.target.value)}
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
          />
        </div>

        {/* Observações do empréstimo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Observações do empréstimo
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            placeholder="Observações opcionais"
          />
        </div>

        {emprestimo.quantidade_devolvida > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Observações da devolução
            </label>
            <textarea
              value={observacoesDevolucao}
              onChange={(e) => setObservacoesDevolucao(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
              placeholder="Observações opcionais"
            />
          </div>
        )}

        {/* Botão salvar */}
        <Button
          onClick={handleSalvar}
          className="h-11 w-full text-ei-accent-foreground cursor-pointer hover:opacity-90"
          style={{ backgroundColor: 'var(--ei-accent)' }}
          disabled={isPending}
        >
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>

        <Button
          variant="outline"
          onClick={onClose}
          className="h-11 w-full cursor-pointer"
          disabled={isPending}
        >
          Cancelar
        </Button>

        {emprestimo.quantidade_devolvida > 0 && (
          <div className="pt-4 border-t">
            {!showConfirmDesfazer ? (
              <Button
                variant="outline"
                onClick={() => setShowConfirmDesfazer(true)}
                className="h-11 w-full cursor-pointer text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                Desfazer devolução
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Isso vai zerar a quantidade devolvida e devolver o estoque
                  para o estado de aberto. Tem certeza?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDesfazer(false)}
                    className="h-11 flex-1 cursor-pointer"
                    disabled={desfazerDevolucaoMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => desfazerDevolucaoMutation.mutate()}
                    className="h-11 flex-1 cursor-pointer bg-destructive hover:bg-destructive/90 text-white"
                    disabled={desfazerDevolucaoMutation.isPending}
                  >
                    {desfazerDevolucaoMutation.isPending
                      ? 'Desfazendo...'
                      : 'Confirmar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );

  return createPortal(modalContent, document.body);
}
