'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';
import { categoriaSchema, type CategoriaFormData } from '@/schemas';
import { useFormApiErrors } from '@/hooks/useFormApiErrors';
import { ITEM_TIPO_LABEL_CURTO, type ItemTipo } from '@/types/itens';

interface ModalCadastrarCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tipo: ItemTipo;
}

export default function ModalCadastrarCategoria({
  isOpen,
  onClose,
  onSuccess,
  tipo,
}: ModalCadastrarCategoriaProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
    },
  });

  const { setApiErrors } = useFormApiErrors<CategoriaFormData>(setError);

  const nomeValue = watch('nome', '');
  const descricaoValue = watch('descricao', '');

  const cadastrarMutation = useMutation({
    mutationFn: async (data: CategoriaFormData) => {
      return await post('/categorias', { ...data, tipo });
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ['categorias', tipo] });
      toast.success('Categoria criada com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      reset();
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      if (error?.response?.data) {
        setApiErrors(error.response.data.errors);
      }
      toast.error(
        `Erro ao criar categoria: ${error?.response?.data?.message || error.message}`,
        {
          position: 'bottom-right',
          autoClose: 5000,
        },
      );
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
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    if (!cadastrarMutation.isPending) {
      reset();
      onClose();
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onSubmit = (data: CategoriaFormData) => {
    cadastrarMutation.mutate(data);
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      data-test="modal-cadastrar-categoria"
      zIndex={99999}
      contentClassName="max-w-lg overflow-visible"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          data-test="modal-cadastrar-categoria-close"
          onClick={handleClose}
          disabled={cadastrarMutation.isPending}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo do Modal */}
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-6">
        <div className="text-center pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Cadastrar categoria
          </h2>
          <p className="text-sm text-muted-foreground">
            ({ITEM_TIPO_LABEL_CURTO[tipo]})
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {nomeValue.length}/50
            </span>
          </div>
          <Input
            data-test="nome-input"
            id="nome"
            type="text"
            placeholder="Nome da categoria"
            maxLength={50}
            {...register('nome')}
            className={`h-11 ${errors.nome ? 'border-destructive' : ''}`}
            disabled={isSubmitting || cadastrarMutation.isPending}
          />
          {errors.nome && (
            <p className="text-destructive text-xs mt-1">
              {errors.nome.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="descricao" className="text-sm font-medium">
              Descrição
            </Label>
            <span className="text-xs text-muted-foreground">
              {descricaoValue?.length || 0}/200
            </span>
          </div>
          <textarea
            data-test="descricao-input"
            id="descricao"
            placeholder="Breve descrição da categoria..."
            maxLength={200}
            {...register('descricao')}
            disabled={isSubmitting || cadastrarMutation.isPending}
            className="w-full px-3 py-2 text-sm bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {errors.descricao && (
            <p className="text-destructive text-xs mt-1">
              {errors.descricao.message}
            </p>
          )}
        </div>

        {cadastrarMutation.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
            <div className="font-medium mb-1">
              Não foi possível cadastrar a categoria
            </div>
            <div className="text-destructive/80">
              {(cadastrarMutation.error as any)?.response?.data?.message ||
                (cadastrarMutation.error as any)?.message ||
                'Erro desconhecido'}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            data-test="modal-cadastrar-categoria-cancelar"
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || cadastrarMutation.isPending}
            className="h-11 flex-1 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            data-test="modal-cadastrar-categoria-confirmar"
            type="submit"
            disabled={isSubmitting || cadastrarMutation.isPending}
            className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
          >
            {isSubmitting || cadastrarMutation.isPending
              ? 'Salvando...'
              : 'Salvar'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
