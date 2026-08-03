'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';

interface ModalExcluirLocalizacaoProps {
  isOpen: boolean;
  onClose: () => void;
  localizacaoId: string;
  localizacaoNome: string;
  onSuccess?: () => void;
}

export default function ModalExcluirLocalizacao({
  isOpen,
  onClose,
  localizacaoId,
  localizacaoNome,
  onSuccess,
}: ModalExcluirLocalizacaoProps) {
  const queryClient = useQueryClient();

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
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const inativarLocalizacaoMutation = useMutation({
    mutationFn: async () => {
      return await patch(`/localizacoes/${localizacaoId}/inativar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizacoes'] });
      queryClient.invalidateQueries({ queryKey: ['localizacoes-infinite'] });
      toast.success('Localização excluída com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao excluir localização';
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    },
  });

  const handleClose = () => {
    if (!inativarLocalizacaoMutation.isPending) {
      onClose();
    }
  };

  const handleConfirm = () => {
    inativarLocalizacaoMutation.mutate();
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      zIndex={99999}
      contentClassName="max-w-lg overflow-visible"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          onClick={handleClose}
          disabled={inativarLocalizacaoMutation.isPending}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo do Modal */}
      <div className="px-6 pb-6 space-y-6">
        <div className="text-center pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Excluir localização
          </h2>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir a localização{' '}
            <span
              className="font-semibold truncate inline-block max-w-[300px] align-bottom"
              title={localizacaoNome}
            >
              {localizacaoNome}
            </span>
            ?
          </p>
        </div>

        {inativarLocalizacaoMutation.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
            <div className="font-medium mb-1">Erro ao excluir localização</div>
            <div className="text-destructive/80">
              {(inativarLocalizacaoMutation.error as any)?.response?.data
                ?.message ||
                (inativarLocalizacaoMutation.error as any)?.message ||
                'Erro desconhecido'}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={inativarLocalizacaoMutation.isPending}
            className="h-11 flex-1 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={inativarLocalizacaoMutation.isPending}
            className="h-11 flex-1 cursor-pointer bg-destructive hover:bg-destructive/90 text-white"
          >
            {inativarLocalizacaoMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

  return createPortal(modalContent, document.body);
}
