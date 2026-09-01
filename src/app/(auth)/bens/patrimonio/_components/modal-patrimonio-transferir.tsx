'use client';

// Transferência de localização de uma unidade patrimonial —
// `PATCH /patrimonios/:id/localizacao`.

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
import CampoLocalizacao from '@/components/item-form/campo-localizacao';

interface ModalPatrimonioTransferirProps {
  isOpen: boolean;
  onClose: () => void;
  patrimonioId: string;
  numeroPatrimonio: string;
  localizacaoAtualId: string;
  onSuccess?: () => void;
}

export default function ModalPatrimonioTransferir({
  isOpen,
  onClose,
  patrimonioId,
  numeroPatrimonio,
  localizacaoAtualId,
  onSuccess,
}: ModalPatrimonioTransferirProps) {
  const queryClient = useQueryClient();
  const [localizacaoDestino, setLocalizacaoDestino] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalizacaoDestino('');
      setObservacoes('');
      setErro('');
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async () =>
      await patch(`/patrimonios/${patrimonioId}/localizacao`, {
        localizacao: localizacaoDestino,
        observacoes: observacoes.trim() || undefined,
      }),
    onSuccess: () => {
      // Prefixo amplo: alcança tanto o drawer (`['patrimonios', itemId]`)
      // quanto a página global de unidades (`['patrimonios', 'lista', ...]`).
      queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
      toast.success(`${numeroPatrimonio} transferido com sucesso!`, {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível transferir a unidade.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  const handleSubmit = () => {
    if (!localizacaoDestino) {
      setErro('Selecione a localização de destino');
      return;
    }
    if (localizacaoDestino === localizacaoAtualId) {
      setErro('A unidade já está nessa localização');
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg"
        data-test="modal-patrimonio-transferir"
      >
        <DialogHeader>
          <DialogTitle>Transferir unidade</DialogTitle>
          <DialogDescription>{numeroPatrimonio}</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <CampoLocalizacao
            value={localizacaoDestino}
            onChange={(id) => {
              setLocalizacaoDestino(id);
              setErro('');
            }}
            label="Nova localização"
            error={erro}
            permitirGerenciar={false}
            localizacaoAtualId={localizacaoAtualId}
            enabled={isOpen}
          />

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
              onClick={handleSubmit}
              className="h-11 flex-1 text-ei-accent-foreground cursor-pointer hover:opacity-90"
              style={{ backgroundColor: 'var(--ei-accent)' }}
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? 'Transferindo...'
                : 'Confirmar Transferência'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
