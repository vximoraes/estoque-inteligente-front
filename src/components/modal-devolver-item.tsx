import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface ModalDevolverItemProps {
  isOpen: boolean;
  onClose: () => void;
  emprestimoId: string;
  itemNome: string;
  quantidadeAberta: number;
  onSuccess?: () => void;
}

export default function ModalDevolverItem({
  isOpen,
  onClose,
  emprestimoId,
  itemNome,
  quantidadeAberta,
  onSuccess,
}: ModalDevolverItemProps) {
  const queryClient = useQueryClient();
  const [quantidade, setQuantidade] = useState(String(quantidadeAberta));
  const [observacoes, setObservacoes] = useState('');
  const [quantidadeError, setQuantidadeError] = useState('');

  const devolucaoMutation = useMutation({
    mutationFn: async () => {
      return await patch(`/emprestimos/${emprestimoId}/devolver`, {
        quantidade_devolvida: Number(quantidade),
        observacoes_devolucao: observacoes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['itens'] });

      toast.success('Devolução registrada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const mensagem =
        error?.errors?.[0]?.message ||
        error?.message ||
        'Não foi possível registrar a devolução.';
      toast.error(mensagem, {
        position: 'top-right',
        autoClose: 5000,
      });
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
    if (!isOpen) return;
    setQuantidade(String(quantidadeAberta));
    setObservacoes('');
    setQuantidadeError('');
  }, [isOpen, quantidadeAberta]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const quantidadeDevolvida = Number(quantidade);
    if (!Number.isInteger(quantidadeDevolvida) || quantidadeDevolvida <= 0) {
      setQuantidadeError('Informe uma quantidade válida');
      return;
    }

    if (quantidadeDevolvida > quantidadeAberta) {
      setQuantidadeError(
        `A quantidade não pode ser maior que o saldo em aberto (${quantidadeAberta})`,
      );
      return;
    }

    setQuantidadeError('');
    devolucaoMutation.mutate();
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-test="modal-devolver-item"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Devolver Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {itemNome}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade em aberto
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {quantidadeAberta}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade devolvida
            </label>
            <input
              type="number"
              min={1}
              max={quantidadeAberta}
              value={quantidade}
              onChange={(e) => {
                setQuantidade(e.target.value);
                setQuantidadeError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            {quantidadeError && (
              <p className="mt-1 text-sm text-red-600">{quantidadeError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observações opcionais"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
            disabled={devolucaoMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="text-white cursor-pointer"
            style={{ backgroundColor: '#306FCC' }}
            disabled={devolucaoMutation.isPending}
          >
            {devolucaoMutation.isPending ? 'Registrando...' : 'Confirmar Devolução'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
