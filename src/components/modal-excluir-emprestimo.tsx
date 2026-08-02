'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { del } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';

interface ModalExcluirEmprestimoProps {
  isOpen: boolean;
  onClose: () => void;
  emprestimoId: string;
  itemNome: string;
  solicitanteNome: string;
  onSuccess?: () => void;
}

export default function ModalExcluirEmprestimo({
  isOpen,
  onClose,
  emprestimoId,
  itemNome,
  solicitanteNome,
  onSuccess,
}: ModalExcluirEmprestimoProps) {
  const queryClient = useQueryClient();

  const excluirMutation = useMutation({
    mutationFn: async () => del(`/emprestimos/${emprestimoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      toast.success('Empréstimo excluído com sucesso!', {
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
        'Erro ao excluir empréstimo.';
      toast.error(msg, { position: 'bottom-right', autoClose: 5000 });
    },
  });

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

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={99999}
      contentClassName="max-w-lg overflow-visible"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="px-6 pb-6 space-y-6">
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Excluir empréstimo
          </h2>
          <div className="max-h-[120px] overflow-y-auto">
            <p className="text-muted-foreground break-words">
              Tem certeza que deseja excluir o empréstimo de{' '}
              <span className="font-semibold">{itemNome}</span> para{' '}
              <span className="font-semibold">{solicitanteNome}</span>?
            </p>
          </div>
        </div>

        {excluirMutation.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive">
            <div className="font-medium mb-1">
              Não foi possível excluir o empréstimo
            </div>
            <div className="text-destructive/80">
              {(excluirMutation.error as any)?.message || 'Erro desconhecido'}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-sm">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={excluirMutation.isPending}
            className="h-11 flex-1 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => excluirMutation.mutate()}
            disabled={excluirMutation.isPending}
            className="h-11 flex-1 text-white hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#DC2626' }}
          >
            {excluirMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
