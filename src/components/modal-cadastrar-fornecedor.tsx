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
import { fornecedorSchema, type FornecedorFormData } from '@/schemas';
import { useFormApiErrors } from '@/hooks/useFormApiErrors';

interface ModalCadastrarFornecedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ModalCadastrarFornecedor({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarFornecedorProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      url: '',
      contato: '',
      descricao: '',
    },
  });

  const { setApiErrors } = useFormApiErrors<FornecedorFormData>(setError);

  const nomeValue = watch('nome', '');
  const contatoValue = watch('contato', '');
  const descricaoValue = watch('descricao', '');

  const cadastrarMutation = useMutation({
    mutationFn: async (data: FornecedorFormData) => {
      return await post('/fornecedores', data);
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor criado com sucesso!', {
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
        `Erro ao criar fornecedor: ${error?.response?.data?.message || error.message}`,
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

  const onSubmit = (data: FornecedorFormData) => {
    cadastrarMutation.mutate(data);
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      data-test="modal-cadastrar-fornecedor"
      zIndex={99999}
      contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          data-test="modal-cadastrar-fornecedor-close"
          onClick={handleClose}
          disabled={cadastrarMutation.isPending}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo do Modal */}
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-5">
        <div className="text-center pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Cadastrar fornecedor
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {nomeValue.length}/100
              </span>
            </div>
            <Input
              data-test="nome-input"
              id="nome"
              type="text"
              placeholder="Nome do fornecedor"
              maxLength={100}
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

          {/* URL */}
          <div>
            <Label htmlFor="url" className="text-sm font-medium mb-2 block">
              URL
            </Label>
            <Input
              data-test="url-input"
              id="url"
              type="url"
              placeholder="https://exemplo.com"
              {...register('url')}
              className={`h-11 ${errors.url ? 'border-destructive' : ''}`}
              disabled={isSubmitting || cadastrarMutation.isPending}
            />
            {errors.url && (
              <p className="text-destructive text-xs mt-1">
                {errors.url.message}
              </p>
            )}
          </div>
        </div>

        {/* Contato */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="contato" className="text-sm font-medium">
              Contato
            </Label>
            <span className="text-xs text-muted-foreground">
              {contatoValue?.length || 0}/100
            </span>
          </div>
          <Input
            data-test="contato-input"
            id="contato"
            type="text"
            placeholder="email@exemplo.com ou telefone"
            maxLength={100}
            {...register('contato')}
            className={`h-11 ${errors.contato ? 'border-destructive' : ''}`}
            disabled={isSubmitting || cadastrarMutation.isPending}
          />
          {errors.contato && (
            <p className="text-destructive text-xs mt-1">
              {errors.contato.message}
            </p>
          )}
        </div>

        {/* Descrição */}
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
            placeholder="Breve descrição do fornecedor..."
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
              Não foi possível cadastrar o fornecedor
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
            data-test="modal-cadastrar-fornecedor-cancelar"
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || cadastrarMutation.isPending}
            className="h-11 flex-1 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            data-test="modal-cadastrar-fornecedor-confirmar"
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
