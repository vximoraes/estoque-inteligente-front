import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';

interface ModalExcluirItemProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  onSuccess?: () => void;
}

export default function ModalExcluirItem({
  isOpen,
  onClose,
  itemId,
  itemNome,
  onSuccess,
}: ModalExcluirItemProps) {
  const queryClient = useQueryClient();

  const excluirMutation = useMutation({
    mutationFn: async () => {
      return await patch(`/itens/${itemId}/inativar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['itens'],
      });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao inativar item:', error);
      if (error?.response?.data) {
        console.error('Resposta da API:', error.response.data);
      }
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

  const handleExcluir = () => {
    if (!itemId) {
      return;
    }

    excluirMutation.mutate();
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={99999}
      data-test="modal-excluir-backdrop"
      contentClassName="max-w-lg overflow-visible"
      role="dialog"
      contentDataTest="modal-excluir"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer"
          title="Fechar"
          data-test="modal-excluir-close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo do Modal */}
      <div className="px-6 pb-6 space-y-6" data-test="modal-excluir-content">
        <div className="text-center pt-4 px-8">
          <h2
            className="text-xl font-semibold text-foreground mb-2"
            data-test="modal-excluir-titulo"
          >
            Excluir item
          </h2>
          <div className="max-h-[120px] overflow-y-auto">
            <p
              className="text-muted-foreground break-words"
              data-test="modal-excluir-mensagem"
            >
              Tem certeza que deseja excluir o item{' '}
              <span
                className="font-semibold"
                data-test="modal-excluir-nome-item"
              >
                {itemNome}
              </span>
              ?
            </p>
          </div>
        </div>

        {/* Mensagem de erro da API */}
        {excluirMutation.error && (
          <div
            className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive"
            data-test="modal-excluir-erro"
          >
            <div className="font-medium mb-1">
              Não foi possível excluir o item
            </div>
            <div className="text-destructive/80">
              {(excluirMutation.error as any)?.response?.data?.message ||
                (excluirMutation.error as any)?.message ||
                'Erro desconhecido'}
            </div>
          </div>
        )}
      </div>

      {/* Footer com ações */}
      <div
        className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-sm"
        data-test="modal-excluir-footer"
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={excluirMutation.isPending}
            className="h-11 flex-1 cursor-pointer"
            data-test="modal-excluir-cancelar"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExcluir}
            disabled={excluirMutation.isPending}
            className="h-11 flex-1 text-white hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#DC2626' }}
            data-test="modal-excluir-confirmar"
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
