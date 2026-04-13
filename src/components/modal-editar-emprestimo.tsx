'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { put } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
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

  const jaDevolvido = emprestimo.quantidade_aberta <= 0;

  useEffect(() => {
    if (!isOpen) return;
    setSolicitante(emprestimo.solicitante_nome || '');
    const dp = emprestimo.data_prevista_devolucao
      ? new Date(emprestimo.data_prevista_devolucao).toISOString().slice(0, 16)
      : '';
    setDataPrevista(dp);
    setObservacoes(emprestimo.observacoes_emprestimo || '');
  }, [isOpen, emprestimo]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const editarMutation = useMutation({
    mutationFn: async () => {
      return await put(`/emprestimos/${emprestimo._id}`, {
        solicitante_nome: solicitante.trim() || undefined,
        data_prevista_devolucao: dataPrevista || undefined,
        observacoes_emprestimo: observacoes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      toast.success('Empréstimo atualizado com sucesso!', { position: 'bottom-right', autoClose: 3000 });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const msg = error?.errors?.[0]?.message || error?.message || 'Erro ao atualizar empréstimo.';
      toast.error(msg, { position: 'bottom-right', autoClose: 5000 });
    },
  });

  const handleSalvar = () => {
    if (solicitante.trim().length < 3) {
      toast.error('Nome do solicitante deve ter no mínimo 3 caracteres.', { position: 'bottom-right', autoClose: 4000 });
      return;
    }
    editarMutation.mutate();
  };

  if (!isOpen) return null;

  const isPending = editarMutation.isPending;

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card rounded-sm border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-sm transition-colors cursor-pointer"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
          <div className="text-center pt-4 px-8">
            <h2 className="text-xl font-semibold text-foreground mb-1">Editar Empréstimo</h2>
            <p className="text-sm text-muted-foreground">{emprestimo.item?.nome || 'Item'}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Solicitante */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Solicitante <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              disabled={jaDevolvido}
              className="w-full px-3 py-2 border border-border rounded-sm outline-none focus:ring-2 focus:ring-[#306FCC]/50 disabled:bg-muted disabled:text-muted-foreground"
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
              disabled={jaDevolvido}
              className="w-full px-3 py-2 border border-border rounded-sm outline-none focus:ring-2 focus:ring-[#306FCC]/50 disabled:bg-muted disabled:text-muted-foreground"
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
              disabled={jaDevolvido}
              className="w-full px-3 py-2 border border-border rounded-sm outline-none focus:ring-2 focus:ring-[#306FCC]/50 disabled:bg-muted disabled:text-muted-foreground"
              placeholder="Observações opcionais"
            />
          </div>

          {/* Botão salvar */}
          {!jaDevolvido && (
            <Button
              onClick={handleSalvar}
              className="w-full text-white cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#306FCC' }}
              disabled={isPending}
            >
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}

          {jaDevolvido && (
            <div className="bg-muted/50 border border-border rounded-sm p-4 text-center text-sm text-muted-foreground">
              Este empréstimo foi totalmente devolvido e não pode ser editado.
            </div>
          )}

          <Button variant="outline" onClick={onClose} className="w-full cursor-pointer" disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
