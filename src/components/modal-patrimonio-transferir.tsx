'use client';

// Transferência de localização de uma unidade patrimonial —
// `PATCH /patrimonios/:id/localizacao`. Select simples em vez do dropdown
// com busca de `modal-cadastrar-item.tsx`: a lista de localizações tende a
// ser pequena, não justifica o custo de manutenção de um segundo dropdown
// custom.

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { get, patch } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ApiEnvelope, Localizacao } from '@/types/itens';

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

  const { data: localizacoesData, isLoading } = useQuery<
    ApiEnvelope<Localizacao>
  >({
    queryKey: ['localizacoes'],
    queryFn: () => get<ApiEnvelope<Localizacao>>('/localizacoes?limite=100'),
    enabled: isOpen,
  });

  const localizacoes = localizacoesData?.data?.docs ?? [];

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
      <DialogContent data-test="modal-patrimonio-transferir">
        <DialogHeader>
          <DialogTitle>Transferir unidade</DialogTitle>
          <DialogDescription>{numeroPatrimonio}</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Nova localização <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                value={localizacaoDestino}
                onChange={(e) => {
                  setLocalizacaoDestino(e.target.value);
                  setErro('');
                }}
                disabled={isLoading}
                className="w-full h-11 px-3 pr-9 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 bg-card text-foreground appearance-none disabled:opacity-60"
              >
                <option value="">
                  {isLoading ? 'Carregando...' : 'Selecionar localização'}
                </option>
                {localizacoes.map((loc) => (
                  <option
                    key={loc._id}
                    value={loc._id}
                    disabled={loc._id === localizacaoAtualId}
                  >
                    {loc.nome}
                    {loc._id === localizacaoAtualId ? ' (atual)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {erro && <p className="mt-1 text-sm text-destructive">{erro}</p>}
          </div>

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
