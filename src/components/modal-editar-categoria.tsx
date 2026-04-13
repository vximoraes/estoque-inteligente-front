'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { categoriaSchema, type CategoriaFormData } from '@/schemas';

interface ModalEditarCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaId: string;
  categoriaNome: string;
  onSuccess?: () => void;
}

export default function ModalEditarCategoria({
  isOpen,
  onClose,
  categoriaId,
  categoriaNome,
  onSuccess,
}: ModalEditarCategoriaProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: categoriaNome,
    },
  });

  const nomeValue = watch('nome', '');

  useEffect(() => {
    reset({ nome: categoriaNome });
  }, [categoriaNome, isOpen, reset]);

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

  const updateCategoriaMutation = useMutation({
    mutationFn: async (data: CategoriaFormData) => {
      return await patch(`/categorias/${categoriaId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-infinite'] });
      toast.success('Categoria atualizada com sucesso!', {
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
        'Erro ao atualizar categoria';
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
    if (!updateCategoriaMutation.isPending) {
      reset({ nome: categoriaNome });
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const onSubmit = (data: CategoriaFormData) => {
    updateCategoriaMutation.mutate(data);
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
        className="bg-card rounded-sm border border-border max-w-md w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleClose}
            disabled={updateCategoriaMutation.isPending}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Editar categoria
            </h2>
            <p className="text-muted-foreground">Atualize o nome da categoria</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label
                htmlFor="nome"
                className="text-sm font-medium text-foreground"
              >
                Nome da categoria <span className="text-destructive">*</span>
              </Label>
              <span className="text-sm text-muted-foreground">
                {nomeValue.length}/100
              </span>
            </div>
            <Input
              id="nome"
              type="text"
              placeholder="Digite o nome da categoria"
              {...register('nome')}
              maxLength={100}
              className={errors.nome ? 'border-destructive' : ''}
              disabled={isSubmitting || updateCategoriaMutation.isPending}
            />
            {errors.nome && (
              <p className="text-destructive text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

          {updateCategoriaMutation.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive">
              <div className="font-medium mb-1">
                Erro ao atualizar categoria
              </div>
              <div className="text-destructive/80">
                {(updateCategoriaMutation.error as any)?.response?.data
                  ?.message ||
                  (updateCategoriaMutation.error as any)?.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || updateCategoriaMutation.isPending}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateCategoriaMutation.isPending}
              className="flex-1 cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
            >
              {isSubmitting || updateCategoriaMutation.isPending
                ? 'Salvando...'
                : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
