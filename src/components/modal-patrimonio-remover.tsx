'use client';

// Remove uma unidade cadastrada por engano — `PATCH /patrimonios/:id/inativar`
// (`ativo: false`). Diferente de "Baixar": baixa é fim de vida útil e fica
// no histórico como unidade real; inativar é erro de cadastro, some da
// listagem (o número de patrimônio fica livre pra reaproveitar).

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

interface ModalPatrimonioRemoverProps {
  isOpen: boolean;
  onClose: () => void;
  patrimonioId: string;
  numeroPatrimonio: string;
  itemId: string;
  onSuccess?: () => void;
}

export default function ModalPatrimonioRemover({
  isOpen,
  onClose,
  patrimonioId,
  numeroPatrimonio,
  itemId,
  onSuccess,
}: ModalPatrimonioRemoverProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () =>
      await patch(`/patrimonios/${patrimonioId}/inativar`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['patrimonios', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item-detalhe', itemId] });
      toast.success(`${numeroPatrimonio} removido.`, {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível remover a unidade.', {
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
      <DialogContent
        className="max-w-sm"
        data-test="modal-patrimonio-remover"
      >
        <DialogHeader className="pb-6">
          <DialogTitle>Remover unidade</DialogTitle>
          <DialogDescription>
            {numeroPatrimonio} — cadastrada por engano? A unidade some da
            listagem e o número fica livre para reaproveitar.
          </DialogDescription>
        </DialogHeader>

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
              className="h-11 flex-1 bg-destructive text-white cursor-pointer hover:opacity-90"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Removendo...' : 'Remover'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
