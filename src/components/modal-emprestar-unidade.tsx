'use client';

// Empréstimo de UNIDADE patrimonial — arquivo separado de
// `modal-emprestar-item.tsx` de propósito: aquele fluxo (quantidade/
// localização) funciona hoje para itens de consumo e não deve arriscar
// regressão por causa de uma ramificação num arquivo grande. Cada patrimônio
// é autocontido (sem item de catálogo), então aqui só se empresta a unidade
// já selecionada no card — sem dropdown de "outras unidades", que dependia
// de um agrupamento por item que não existe mais.

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import type { PatrimonioData } from '@/types/patrimonios';

interface EmprestimoUnidadeRequest {
  patrimonio: string;
  solicitante_nome: string;
  solicitante_email?: string;
  data_prevista_devolucao?: string;
  observacoes_emprestimo?: string;
}

interface ModalEmprestarUnidadeProps {
  isOpen: boolean;
  onClose: () => void;
  patrimonio: PatrimonioData;
  onSuccess?: () => void;
}

export default function ModalEmprestarUnidade({
  isOpen,
  onClose,
  patrimonio,
  onSuccess,
}: ModalEmprestarUnidadeProps) {
  const queryClient = useQueryClient();

  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [errors, setErrors] = useState<{
    solicitanteNome?: string;
    solicitanteEmail?: string;
    dataPrevista?: string;
  }>({});

  const emprestimoMutation = useMutation({
    mutationFn: async (payload: EmprestimoUnidadeRequest) => {
      return await post('/emprestimos', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['patrimonios'] });

      toast.success('Empréstimo registrado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const mensagem =
        error?.message || 'Não foi possível registrar o empréstimo.';
      toast.error(mensagem, {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setSolicitanteNome('');
    setSolicitanteEmail('');
    setDataPrevista('');
    setObservacoes('');
    setErrors({});
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!solicitanteNome || solicitanteNome.trim().length < 3) {
      newErrors.solicitanteNome = 'Informe o solicitante (mín. 3 caracteres)';
    }

    if (solicitanteEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(solicitanteEmail.trim())) {
        newErrors.solicitanteEmail = 'E-mail inválido';
      }
    }

    if (dataPrevista) {
      const data = new Date(dataPrevista);
      if (Number.isNaN(data.getTime()) || data <= new Date()) {
        newErrors.dataPrevista = 'A data prevista deve ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    emprestimoMutation.mutate({
      patrimonio: patrimonio._id,
      solicitante_nome: solicitanteNome.trim(),
      solicitante_email: solicitanteEmail.trim() || undefined,
      data_prevista_devolucao: dataPrevista
        ? new Date(dataPrevista).toISOString()
        : undefined,
      observacoes_emprestimo: observacoes.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        data-test="modal-emprestar-unidade"
      >
        <DialogHeader>
          <DialogTitle>Emprestar unidade</DialogTitle>
          <DialogDescription>
            {patrimonio.numero_patrimonio}
            {patrimonio.modelo ? ` — ${patrimonio.modelo}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Solicitante <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={solicitanteNome}
              onChange={(e) => {
                setSolicitanteNome(e.target.value);
                setErrors((prev) => ({ ...prev, solicitanteNome: undefined }));
              }}
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
              placeholder="Nome da pessoa solicitante"
            />
            {errors.solicitanteNome && (
              <p className="mt-1 text-sm text-destructive">
                {errors.solicitanteNome}
              </p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              E-mail do solicitante
            </label>
            <input
              type="email"
              value={solicitanteEmail}
              onChange={(e) => {
                setSolicitanteEmail(e.target.value);
                setErrors((prev) => ({ ...prev, solicitanteEmail: undefined }));
              }}
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
              placeholder="E-mail da pessoa solicitante (opcional)"
            />
            {errors.solicitanteEmail && (
              <p className="mt-1 text-sm text-destructive">
                {errors.solicitanteEmail}
              </p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Data prevista de devolução
            </label>
            <input
              type="datetime-local"
              value={dataPrevista}
              onChange={(e) => {
                setDataPrevista(e.target.value);
                setErrors((prev) => ({ ...prev, dataPrevista: undefined }));
              }}
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            />
            {errors.dataPrevista && (
              <p className="mt-1 text-sm text-destructive">
                {errors.dataPrevista}
              </p>
            )}
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
              disabled={emprestimoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-11 flex-1 text-ei-accent-foreground cursor-pointer hover:opacity-90"
              style={{ backgroundColor: 'var(--ei-accent)' }}
              disabled={emprestimoMutation.isPending}
            >
              {emprestimoMutation.isPending
                ? 'Registrando...'
                : 'Confirmar Empréstimo'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
