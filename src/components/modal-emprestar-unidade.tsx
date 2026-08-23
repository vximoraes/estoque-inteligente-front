'use client';

// Empréstimo de UNIDADE patrimonial — arquivo separado de
// `modal-emprestar-item.tsx` de propósito: aquele fluxo (quantidade/
// localização) funciona hoje para itens de consumo e não deve arriscar
// regressão por causa de uma ramificação num arquivo grande. Aqui o
// seletor é de unidade, não de quantidade.

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
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
import type { PatrimonioApiResponse } from '@/types/patrimonios';

interface EmprestimoUnidadeRequest {
  item: string;
  patrimonio: string;
  localizacao: string;
  quantidade_emprestada: number;
  solicitante_nome: string;
  solicitante_email?: string;
  data_prevista_devolucao?: string;
  observacoes_emprestimo?: string;
}

interface ModalEmprestarUnidadeProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  /** Pré-seleciona a unidade quando a ação parte de uma linha específica
   * do drawer de unidades — pula a etapa de escolha. */
  patrimonioPreSelecionado?: string;
  onSuccess?: () => void;
}

export default function ModalEmprestarUnidade({
  isOpen,
  onClose,
  itemId,
  itemNome,
  patrimonioPreSelecionado,
  onSuccess,
}: ModalEmprestarUnidadeProps) {
  const queryClient = useQueryClient();

  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [errors, setErrors] = useState<{
    unidade?: string;
    solicitanteNome?: string;
    solicitanteEmail?: string;
    dataPrevista?: string;
  }>({});

  const { data: unidadesData, isLoading: isLoadingUnidades } =
    useQuery<PatrimonioApiResponse>({
      queryKey: ['patrimonios', itemId, 'Disponível'],
      queryFn: () =>
        get<PatrimonioApiResponse>(
          `/patrimonios?item=${itemId}&status=Disponível&limite=100`,
        ),
      enabled: isOpen && !!itemId,
    });

  const unidadesDisponiveis = unidadesData?.data?.docs ?? [];

  const emprestimoMutation = useMutation({
    mutationFn: async (payload: EmprestimoUnidadeRequest) => {
      return await post('/emprestimos', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['patrimonios', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item-detalhe', itemId] });

      toast.success('Empréstimo registrado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      // `fetchData` não expõe o status HTTP ao caller, só `error.message`
      // (o `message` que a API já devolve — para 409 já é "Esta unidade
      // já está emprestada." de forma legível). Recarregar a lista de
      // disponíveis em qualquer erro é seguro: se foi uma corrida por
      // outra requisição, a unidade já não vai aparecer mais como opção.
      queryClient.invalidateQueries({
        queryKey: ['patrimonios', itemId, 'Disponível'],
      });
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
    setUnidadeSelecionada(patrimonioPreSelecionado ?? '');
    setIsDropdownOpen(false);
    setSolicitanteNome('');
    setSolicitanteEmail('');
    setDataPrevista('');
    setObservacoes('');
    setErrors({});
  }, [isOpen, patrimonioPreSelecionado]);

  // Fechar no Escape já é o Radix Dialog que cuida (`onOpenChange`); aqui só
  // fecha o dropdown de unidade quando o clique é fora dele.
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const unidadeSelecionadaObj = unidadesDisponiveis.find(
    (u) => u._id === unidadeSelecionada,
  );

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!unidadeSelecionada) {
      newErrors.unidade = 'Selecione uma unidade';
    }

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
    if (!validateForm() || !unidadeSelecionadaObj) return;

    emprestimoMutation.mutate({
      item: itemId,
      patrimonio: unidadeSelecionadaObj._id,
      localizacao: unidadeSelecionadaObj.localizacao._id,
      quantidade_emprestada: 1,
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
          <DialogDescription className="sr-only">
            Formulário para emprestar uma unidade de {itemNome}
          </DialogDescription>
        </DialogHeader>

      <div className="p-6 space-y-5">
        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Item
          </label>
          <div className="w-full h-11 flex items-center px-3 border border-border rounded-md bg-muted/50 text-muted-foreground">
            {itemNome}
          </div>
        </div>

        <div className="relative" data-dropdown>
          <label className="block text-base font-medium text-foreground mb-1">
            Unidade <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoadingUnidades}
            className="w-full h-11 flex items-center justify-between px-3 border border-border rounded-md text-left hover:border-[var(--ei-accent)]/40 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span
              className={
                unidadeSelecionadaObj
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }
            >
              {isLoadingUnidades
                ? 'Carregando...'
                : unidadeSelecionadaObj
                  ? `${unidadeSelecionadaObj.numero_patrimonio} — ${unidadeSelecionadaObj.localizacao?.nome ?? ''}`
                  : 'Selecionar unidade'}
            </span>
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md z-50 max-h-60 overflow-y-auto">
              {unidadesDisponiveis.length > 0 ? (
                unidadesDisponiveis.map((unidade) => (
                  <button
                    key={unidade._id}
                    type="button"
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                      unidadeSelecionada === unidade._id
                        ? 'bg-[var(--ei-accent)]/5 text-[var(--ei-accent)] font-medium'
                        : 'text-foreground'
                    }`}
                    onClick={() => {
                      setUnidadeSelecionada(unidade._id);
                      setIsDropdownOpen(false);
                      setErrors((prev) => ({ ...prev, unidade: undefined }));
                    }}
                  >
                    <span className="truncate">
                      {unidade.numero_patrimonio}
                    </span>
                    <span className="text-sm px-2 py-0.5 rounded-md shrink-0 bg-muted/50 text-muted-foreground">
                      {unidade.localizacao?.nome ?? '—'}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Nenhuma unidade disponível para empréstimo.
                </div>
              )}
            </div>
          )}
          {errors.unidade && (
            <p className="mt-1 text-sm text-destructive">{errors.unidade}</p>
          )}
        </div>

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
              disabled={
                emprestimoMutation.isPending || unidadesDisponiveis.length === 0
              }
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
