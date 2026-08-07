import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';
import { usuarioSchema, type UsuarioFormData } from '@/schemas';
import { useFormApiErrors } from '@/hooks/useFormApiErrors';

interface ModalCadastrarUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ModalCadastrarUsuario({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarUsuarioProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
  });

  const { setApiErrors } = useFormApiErrors<UsuarioFormData>(setError);

  const nomeValue = watch('nome', '');

  const cadastrarMutation = useMutation({
    mutationFn: async (data: UsuarioFormData) => {
      return await post('/usuarios/convidar', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['usuarios'],
      });

      toast.success('Usuário cadastrado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });

      reset();
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar usuário:', error);

      if (error?.response?.data) {
        const errorData = error.response.data;
        setApiErrors(errorData.errors);
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

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data: UsuarioFormData) => {
    cadastrarMutation.mutate(data);
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      data-test="modal-cadastrar-usuario"
      zIndex={99999}
      contentClassName="max-w-lg overflow-visible"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          data-test="modal-cadastrar-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo do Modal */}
      <div className="px-6 pb-6 space-y-6">
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Cadastrar usuário
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Um e-mail será enviado para o usuário definir sua senha.
          </p>
        </div>

        {/* Campo Nome */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="nome"
              className="block text-base font-medium text-foreground"
            >
              Nome <span className="text-destructive">*</span>
            </label>
            <span className="text-sm text-muted-foreground">
              {nomeValue.length}/100
            </span>
          </div>
          <input
            data-test="nome-input"
            id="nome"
            type="text"
            placeholder="Nome do usuário"
            maxLength={100}
            {...register('nome')}
            className={`w-full h-11 px-3 text-base md:text-sm bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.nome ? 'border-destructive' : 'border-border'
            }`}
            disabled={isSubmitting || cadastrarMutation.isPending}
          />
          {errors.nome && (
            <p className="text-destructive text-sm mt-1">
              {errors.nome.message}
            </p>
          )}
        </div>

        {/* Campo E-mail */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-base font-medium text-foreground"
          >
            E-mail <span className="text-destructive">*</span>
          </label>
          <input
            data-test="email-input"
            id="email"
            type="email"
            placeholder="E-mail do usuário"
            {...register('email')}
            className={`w-full h-11 px-3 text-base md:text-sm bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.email ? 'border-destructive' : 'border-border'
            }`}
            disabled={isSubmitting || cadastrarMutation.isPending}
          />
          {errors.email && (
            <p className="text-destructive text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Mensagem de erro da API */}
        {cadastrarMutation.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
            <div className="font-medium mb-1">
              Não foi possível cadastrar o usuário
            </div>
            <div className="text-destructive/80">
              {(cadastrarMutation.error as any)?.response?.data?.message ||
                (cadastrarMutation.error as any)?.message ||
                'Erro desconhecido'}
            </div>
          </div>
        )}
      </div>

      {/* Footer com ações */}
      <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
        <div className="flex gap-3">
          <Button
            data-test="modal-cadastrar-cancelar"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || cadastrarMutation.isPending}
            className="h-11 flex-1 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            data-test="modal-cadastrar-confirmar"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || cadastrarMutation.isPending}
            className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
          >
            {isSubmitting || cadastrarMutation.isPending
              ? 'Cadastrando...'
              : 'Cadastrar'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
