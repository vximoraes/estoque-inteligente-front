'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';

interface ModalExcluirCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaId: string;
  categoriaNome: string;
  onSuccess?: () => void;
}

export default function ModalExcluirCategoria({
  isOpen,
  onClose,
  categoriaId,
  categoriaNome,
  onSuccess,
}: ModalExcluirCategoriaProps) {
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

  const inativarCategoriaMutation = useMutation({
    mutationFn: async () => {
      return await patch(`/categorias/${categoriaId}/inativar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-infinite'] });
      toast.success('Categoria excluída com sucesso!', {
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
        'Erro ao excluir categoria';
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
    if (!inativarCategoriaMutation.isPending) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleConfirm = () => {
    inativarCategoriaMutation.mutate();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-card rounded-sm border border-border max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleClose}
            disabled={inativarCategoriaMutation.isPending}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Excluir categoria
            </h2>
            <p className="text-muted-foreground">
              Tem certeza que deseja excluir a categoria{' '}
              <span
                className="font-semibold truncate inline-block max-w-[300px] align-bottom"
                title={categoriaNome}
              >
                {categoriaNome}
              </span>
              ?
            </p>
          </div>

          {inativarCategoriaMutation.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive">
              <div className="font-medium mb-1">Erro ao excluir categoria</div>
              <div className="text-destructive/80">
                {(inativarCategoriaMutation.error as any)?.response?.data
                  ?.message ||
                  (inativarCategoriaMutation.error as any)?.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inativarCategoriaMutation.isPending}
              className="h-11 flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={inativarCategoriaMutation.isPending}
              className="h-11 flex-1 cursor-pointer bg-destructive hover:bg-destructive/90 text-white"
            >
              {inativarCategoriaMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
