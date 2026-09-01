'use client';

// Confirmação de transição de status de uma unidade patrimonial
// (Manutenção / retorno da manutenção / baixa / reativação) — todas passam
// por `PATCH /patrimonios/:id/status`, só muda o `novoStatus` e o texto.
// Radix Dialog (não `ModalShell`): precisa abrir por cima do drawer de
// unidades sem fechá-lo, e só um Dialog aninhado em outro Radix Dialog
// (o `Sheet`) evita o conflito de focus-trap que um `createPortal` avulso
// teria com os inputs daqui.

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { patch } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { PatrimonioStatus } from '@/types/patrimonios';

interface ModalPatrimonioStatusProps {
  isOpen: boolean;
  onClose: () => void;
  patrimonioId: string;
  numeroPatrimonio: string;
  novoStatus: Extract<
    PatrimonioStatus,
    'Disponível' | 'Manutenção' | 'Baixado'
  >;
  titulo: string;
  descricao: string;
  confirmLabel: string;
  destrutivo?: boolean;
  onSuccess?: () => void;
}

export default function ModalPatrimonioStatus({
  isOpen,
  onClose,
  patrimonioId,
  numeroPatrimonio,
  novoStatus,
  titulo,
  descricao,
  confirmLabel,
  destrutivo = false,
  onSuccess,
}: ModalPatrimonioStatusProps) {
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) setObservacoes('');
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async () =>
      await patch(`/patrimonios/${patrimonioId}/status`, {
        status: novoStatus,
        observacoes: observacoes.trim() || undefined,
      }),
    onSuccess: () => {
      // Prefixo amplo: alcança tanto o detalhe da unidade já aberto quanto
      // a página global de unidades (`['patrimonios', 'lista', ...]`).
      queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
      toast.success(`${numeroPatrimonio} atualizado com sucesso!`, {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível atualizar o status.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg" data-test="modal-patrimonio-status">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {numeroPatrimonio} — {descricao}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
              rows={3}
              placeholder="Observações opcionais"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-11 flex-1 cursor-pointer"
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              className={`h-11 flex-1 cursor-pointer ${
                destrutivo
                  ? 'bg-destructive text-white hover:opacity-90'
                  : 'text-ei-accent-foreground hover:opacity-90'
              }`}
              style={
                destrutivo ? undefined : { backgroundColor: 'var(--ei-accent)' }
              }
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Salvando...' : confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
