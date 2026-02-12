import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
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
  onSuccess
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

  const nomeValue = watch("nome", "");

  const cadastrarMutation = useMutation({
    mutationFn: async (data: UsuarioFormData) => {
      return await post('/usuarios/convidar', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['usuarios']
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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const onSubmit = (data: UsuarioFormData) => {
    cadastrarMutation.mutate(data);
  };

  const modalContent = (
    <div
      data-test="modal-cadastrar-usuario"
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            data-test="modal-cadastrar-close"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4 px-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cadastrar usuário
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Um e-mail será enviado para o usuário definir sua senha.
            </p>
          </div>

          {/* Campo Nome */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="nome" className="block text-base font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <span className="text-sm text-gray-500">
                {nomeValue.length}/100
              </span>
            </div>
            <input
              data-test="nome-input"
              id="nome"
              type="text"
              placeholder="Nome do usuário"
              maxLength={100}
              {...register("nome")}
              className={`w-full px-4 py-3 bg-white border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
              disabled={isSubmitting || cadastrarMutation.isPending}
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

          {/* Campo E-mail */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-base font-medium text-gray-700">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              data-test="email-input"
              id="email"
              type="email"
              placeholder="E-mail do usuário"
              {...register("email")}
              className={`w-full px-4 py-3 bg-white border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              disabled={isSubmitting || cadastrarMutation.isPending}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Mensagem de erro da API */}
          {cadastrarMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <div className="font-medium mb-1">Não foi possível cadastrar o usuário</div>
              <div className="text-red-500">
                {(cadastrarMutation.error as any)?.response?.data?.message ||
                  (cadastrarMutation.error as any)?.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <Button
              data-test="modal-cadastrar-cancelar"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || cadastrarMutation.isPending}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              data-test="modal-cadastrar-confirmar"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || cadastrarMutation.isPending}
              className="flex-1 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
            >
              {isSubmitting || cadastrarMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
