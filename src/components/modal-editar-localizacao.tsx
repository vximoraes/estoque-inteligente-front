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
import { localizacaoSchema, type LocalizacaoFormData } from '@/schemas';

interface ModalEditarLocalizacaoProps {
  isOpen: boolean;
  onClose: () => void;
  localizacaoId: string;
  localizacaoNome: string;
  onSuccess?: () => void;
}

export default function ModalEditarLocalizacao({
  isOpen,
  onClose,
  localizacaoId,
  localizacaoNome,
  onSuccess,
}: ModalEditarLocalizacaoProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocalizacaoFormData>({
    resolver: zodResolver(localizacaoSchema),
    defaultValues: {
      nome: localizacaoNome,
    },
  });

  const nomeValue = watch('nome', '');

  useEffect(() => {
    reset({ nome: localizacaoNome });
  }, [localizacaoNome, isOpen, reset]);

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

  const updateLocalizacaoMutation = useMutation({
    mutationFn: async (data: LocalizacaoFormData) => {
      return await patch(`/localizacoes/${localizacaoId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizacoes'] });
      queryClient.invalidateQueries({ queryKey: ['localizacoes-infinite'] });
      toast.success('Localização atualizada com sucesso!', {
        position: 'top-right',
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
        'Erro ao atualizar localização';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    },
  });

  const handleClose = () => {
    if (!updateLocalizacaoMutation.isPending) {
      reset({ nome: localizacaoNome });
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const onSubmit = (data: LocalizacaoFormData) => {
    updateLocalizacaoMutation.mutate(data);
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
        className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleClose}
            disabled={updateLocalizacaoMutation.isPending}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Editar localização
            </h2>
            <p className="text-gray-600">Atualize o nome da localização</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label
                htmlFor="nome"
                className="text-sm font-medium text-gray-900"
              >
                Nome da localização <span className="text-red-500">*</span>
              </Label>
              <span className="text-sm text-gray-500">
                {nomeValue.length}/100
              </span>
            </div>
            <Input
              id="nome"
              type="text"
              placeholder="Digite o nome da localização"
              {...register('nome')}
              maxLength={100}
              className={errors.nome ? 'border-red-500' : ''}
              disabled={isSubmitting || updateLocalizacaoMutation.isPending}
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

          {updateLocalizacaoMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <div className="font-medium mb-1">
                Erro ao atualizar localização
              </div>
              <div className="text-red-500">
                {(updateLocalizacaoMutation.error as any)?.response?.data
                  ?.message ||
                  (updateLocalizacaoMutation.error as any)?.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || updateLocalizacaoMutation.isPending}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateLocalizacaoMutation.isPending}
              className="flex-1 cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
            >
              {isSubmitting || updateLocalizacaoMutation.isPending
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
