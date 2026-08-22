'use client';

// Adiciona mais unidades a um item permanente já cadastrado —
// `POST /patrimonios/lote`, mesmo endpoint usado no cadastro inicial do
// item. `numero_inicial` é calculado a partir das unidades já existentes
// com o mesmo prefixo, pra continuar a numeração sem colidir.

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
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
import type { ApiEnvelope, Localizacao } from '@/types/itens';
import type { PatrimonioData } from '@/types/patrimonios';

interface ModalPatrimonioAdicionarUnidadesProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  unidadesExistentes: PatrimonioData[];
  onSuccess?: () => void;
}

function prefixoMaisComum(unidades: PatrimonioData[]) {
  const contagem = new Map<string, number>();
  for (const u of unidades) {
    const prefixo = u.numero_patrimonio.split('-')[0] ?? '';
    if (!prefixo) continue;
    contagem.set(prefixo, (contagem.get(prefixo) ?? 0) + 1);
  }
  let melhor = '';
  let max = 0;
  for (const [prefixo, qtd] of contagem) {
    if (qtd > max) {
      melhor = prefixo;
      max = qtd;
    }
  }
  return melhor;
}

function proximoNumero(unidades: PatrimonioData[], prefixo: string) {
  const alvo = prefixo.trim().toUpperCase();
  let maior = 0;
  for (const u of unidades) {
    const [p, sufixo] = u.numero_patrimonio.split('-');
    if (p !== alvo) continue;
    const n = parseInt(sufixo ?? '', 10);
    if (!Number.isNaN(n) && n > maior) maior = n;
  }
  return maior + 1;
}

export default function ModalPatrimonioAdicionarUnidades({
  isOpen,
  onClose,
  itemId,
  itemNome,
  unidadesExistentes,
  onSuccess,
}: ModalPatrimonioAdicionarUnidadesProps) {
  const queryClient = useQueryClient();
  const [localizacao, setLocalizacao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [prefixo, setPrefixo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erros, setErros] = useState<{
    localizacao?: string;
    quantidade?: string;
    prefixo?: string;
  }>({});

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
      setLocalizacao('');
      setQuantidade('1');
      setPrefixo(prefixoMaisComum(unidadesExistentes));
      setObservacoes('');
      setErros({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const numeroInicial = useMemo(
    () => proximoNumero(unidadesExistentes, prefixo),
    [unidadesExistentes, prefixo],
  );

  const mutation = useMutation({
    mutationFn: async () =>
      await post('/patrimonios/lote', {
        item: itemId,
        localizacao,
        quantidade: Number(quantidade),
        prefixo: prefixo.trim(),
        numero_inicial: numeroInicial,
        observacoes: observacoes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['patrimonios', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item-detalhe', itemId] });
      toast.success('Unidades adicionadas com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.message || 'Não foi possível adicionar as unidades.',
        { position: 'bottom-right', autoClose: 5000 },
      );
    },
  });

  const handleSubmit = () => {
    const novosErros: typeof erros = {};
    if (!localizacao) novosErros.localizacao = 'Selecione a localização';
    const qtd = Number(quantidade);
    if (!quantidade || !Number.isInteger(qtd) || qtd < 1 || qtd > 500) {
      novosErros.quantidade = 'Quantidade: 1 a 500';
    }
    if (!prefixo.trim()) novosErros.prefixo = 'Prefixo é obrigatório';

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;
    mutation.mutate();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent data-test="modal-patrimonio-adicionar-unidades">
        <DialogHeader>
          <DialogTitle>Adicionar unidades</DialogTitle>
          <DialogDescription>{itemNome}</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Localização <span className="text-destructive">*</span>
            </label>
            <select
              value={localizacao}
              onChange={(e) => {
                setLocalizacao(e.target.value);
                setErros((prev) => ({ ...prev, localizacao: undefined }));
              }}
              disabled={isLoading}
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 bg-card disabled:opacity-60"
            >
              <option value="">
                {isLoading ? 'Carregando...' : 'Selecionar localização'}
              </option>
              {localizacoes.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.nome}
                </option>
              ))}
            </select>
            {erros.localizacao && (
              <p className="mt-1 text-sm text-destructive">
                {erros.localizacao}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                Quantidade <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={quantidade}
                onChange={(e) => {
                  setQuantidade(e.target.value);
                  setErros((prev) => ({ ...prev, quantidade: undefined }));
                }}
                className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
              />
              {erros.quantidade && (
                <p className="mt-1 text-sm text-destructive">
                  {erros.quantidade}
                </p>
              )}
            </div>
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                Prefixo <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={prefixo}
                onChange={(e) => {
                  setPrefixo(e.target.value);
                  setErros((prev) => ({ ...prev, prefixo: undefined }));
                }}
                className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
                placeholder="ACC"
              />
              {erros.prefixo && (
                <p className="mt-1 text-sm text-destructive">
                  {erros.prefixo}
                </p>
              )}
            </div>
          </div>

          {prefixo.trim() && (
            <p className="text-sm text-muted-foreground -mt-2">
              Numeração: {prefixo.trim().toUpperCase()}-
              {String(numeroInicial).padStart(4, '0')} até{' '}
              {prefixo.trim().toUpperCase()}-
              {String(numeroInicial + Number(quantidade || '1') - 1).padStart(
                4,
                '0',
              )}
            </p>
          )}

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
              {mutation.isPending ? 'Adicionando...' : 'Adicionar Unidades'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
