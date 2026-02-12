import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { del } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';

interface ModalExcluirUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: string;
  usuarioNome: string;
  onSuccess?: () => void;
}

export default function ModalExcluirUsuario({
  isOpen,
  onClose,
  usuarioId,
  usuarioNome,
  onSuccess
}: ModalExcluirUsuarioProps) {
  const queryClient = useQueryClient();

  const excluirMutation = useMutation({
    mutationFn: async () => {
      return await del(`/usuarios/${usuarioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['usuarios']
      });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao excluir usuário:', error);
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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleExcluir = () => {
    if (!usuarioId) {
      return;
    }

    excluirMutation.mutate();
  };

  const modalContent = (
    <div
      data-test="modal-excluir-usuario"
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
            data-test="modal-excluir-close"
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
              Excluir usuário
            </h2>
            <div className="max-h-[120px] overflow-y-auto">
              <p className="text-gray-600 break-words">
                Tem certeza que deseja excluir o usuário <span data-test="modal-excluir-nome-usuario" className="font-semibold">{usuarioNome}</span>?
              </p>
            </div>
          </div>

          {/* Mensagem de erro da API */}
          {excluirMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <div className="font-medium mb-1">Não foi possível excluir o usuário</div>
              <div className="text-red-500">
                {(excluirMutation.error as any)?.response?.data?.message ||
                  (excluirMutation.error as any)?.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <Button
              data-test="modal-excluir-cancelar"
              variant="outline"
              onClick={onClose}
              disabled={excluirMutation.isPending}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              data-test="modal-excluir-confirmar"
              onClick={handleExcluir}
              disabled={excluirMutation.isPending}
              className="flex-1 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#DC2626' }}
            >
              {excluirMutation.isPending ? 'Excluindo...' : 'Excluir'}
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
