import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
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
        position: 'bottom-right',
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

  const handleSubmit = () => {
    const quantidadeDevolvida = Number(quantidade);
    if (!Number.isInteger(quantidadeDevolvida) || quantidadeDevolvida <= 0) {
      setQuantidadeError('Quantidade deve ser maior que 0');
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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="z-50"
      data-test="modal-devolver-item"
      contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
          data-test="modal-devolver-item-close"
        >
          <X size={20} className="text-muted-foreground" />
        </button>
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Devolver Item
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Item
          </label>
          <div className="w-full h-11 flex items-center px-3 border border-border rounded-md bg-muted/50 text-muted-foreground">
            {itemNome}
          </div>
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Quantidade em aberto
          </label>
          <div className="w-full h-11 flex items-center px-3 border border-border rounded-md bg-muted/50 text-muted-foreground">
            {quantidadeAberta}
          </div>
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Quantidade devolvida <span className="text-destructive">*</span>
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
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            placeholder="Digite a quantidade"
            data-test="modal-devolver-item-quantidade"
          />
          {quantidadeError && (
            <p className="mt-1 text-sm text-destructive">{quantidadeError}</p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            placeholder="Observações opcionais"
            data-test="modal-devolver-item-observacoes"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 flex-1 cursor-pointer"
            disabled={devolucaoMutation.isPending}
            data-test="modal-devolver-item-cancelar"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-11 flex-1 text-ei-accent-foreground cursor-pointer hover:opacity-90"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            disabled={devolucaoMutation.isPending}
            data-test="modal-devolver-item-confirmar"
          >
            {devolucaoMutation.isPending
              ? 'Registrando...'
              : 'Confirmar Devolução'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

  return createPortal(modalContent, document.body);
}
