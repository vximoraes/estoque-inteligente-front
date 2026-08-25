'use client';

// Cadastro de uma unidade de patrimônio individual — `POST /patrimonios`.
// Substitui o cadastro em lote na UI (a API ainda aceita `/patrimonios/lote`,
// mas cada bem físico agora é registrado como o card próprio que é). O
// número de patrimônio é sugerido a partir das unidades já existentes do
// modelo escolhido, mas fica sempre editável.

import { useEffect, useState } from 'react';
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
import CampoItem from '@/components/item-form/campo-item';
import CampoLocalizacao from '@/components/item-form/campo-localizacao';
import CamposPersonalizadosEditor from '@/components/campos-personalizados-editor';
import { sugerirNumeroPatrimonio } from '@/lib/patrimonio-numeracao';
import type { CampoPersonalizado, PatrimonioApiResponse } from '@/types/patrimonios';

interface ModalCadastrarPatrimonioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ModalCadastrarPatrimonio({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarPatrimonioProps) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [numeroPatrimonio, setNumeroPatrimonio] = useState('');
  const [numeroEditadoManualmente, setNumeroEditadoManualmente] =
    useState(false);
  const [localizacao, setLocalizacao] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [camposPersonalizados, setCamposPersonalizados] = useState<
    CampoPersonalizado[]
  >([]);
  const [erros, setErros] = useState<{
    item?: string;
    numeroPatrimonio?: string;
    localizacao?: string;
    camposPersonalizados?: string;
  }>({});

  const resetForm = () => {
    setItemId('');
    setNumeroPatrimonio('');
    setNumeroEditadoManualmente(false);
    setLocalizacao('');
    setDataAquisicao('');
    setObservacoes('');
    setCamposPersonalizados([]);
    setErros({});
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  // Sugestão de número: só busca as unidades do modelo escolhido quando o
  // usuário ainda não editou o campo manualmente, pra não pisar numa
  // digitação em andamento.
  const { data: unidadesDoItem } = useQuery<PatrimonioApiResponse>({
    queryKey: ['patrimonios', itemId, 'sugestao-numero'],
    queryFn: () =>
      get<PatrimonioApiResponse>(`/patrimonios?item=${itemId}&limite=100`),
    enabled: isOpen && !!itemId && !numeroEditadoManualmente,
  });

  useEffect(() => {
    if (numeroEditadoManualmente || !unidadesDoItem) return;
    const sugestao = sugerirNumeroPatrimonio(unidadesDoItem.data.docs);
    if (sugestao) setNumeroPatrimonio(sugestao);
  }, [unidadesDoItem, numeroEditadoManualmente]);

  const mutation = useMutation({
    mutationFn: async () =>
      await post('/patrimonios', {
        item: itemId,
        numero_patrimonio: numeroPatrimonio.trim(),
        localizacao,
        data_aquisicao: dataAquisicao
          ? new Date(dataAquisicao).toISOString()
          : undefined,
        observacoes: observacoes.trim() || undefined,
        campos_personalizados: camposPersonalizados
          .map((c) => ({ chave: c.chave.trim(), valor: c.valor.trim() }))
          .filter((c) => c.chave && c.valor),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
      toast.success('Unidade de patrimônio cadastrada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.message || 'Não foi possível cadastrar a unidade.',
        { position: 'bottom-right', autoClose: 5000 },
      );
    },
  });

  const handleSubmit = () => {
    const chaves = new Set<string>();
    let duplicada = false;
    for (const campo of camposPersonalizados) {
      const chave = campo.chave.trim().toLocaleLowerCase('pt-BR');
      if (!chave) continue;
      if (chaves.has(chave)) duplicada = true;
      chaves.add(chave);
    }

    const novosErros: typeof erros = {};
    if (!itemId) novosErros.item = 'Selecione o modelo';
    if (!numeroPatrimonio.trim()) {
      novosErros.numeroPatrimonio = 'Número de patrimônio é obrigatório';
    }
    if (!localizacao) novosErros.localizacao = 'Selecione a localização';
    if (duplicada) {
      novosErros.camposPersonalizados = 'Há campos personalizados duplicados';
    }

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
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        data-test="modal-cadastrar-patrimonio"
      >
        <DialogHeader>
          <DialogTitle>Cadastrar unidade de patrimônio</DialogTitle>
          <DialogDescription>
            Cada bem físico é registrado individualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <CampoItem
            value={itemId}
            onChange={(id) => {
              setItemId(id);
              setErros((prev) => ({ ...prev, item: undefined }));
            }}
            error={erros.item}
            enabled={isOpen}
          />

          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Número de patrimônio <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={numeroPatrimonio}
              onChange={(e) => {
                setNumeroPatrimonio(e.target.value);
                setNumeroEditadoManualmente(true);
                setErros((prev) => ({
                  ...prev,
                  numeroPatrimonio: undefined,
                }));
              }}
              maxLength={60}
              placeholder="NB-0001"
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            />
            {erros.numeroPatrimonio && (
              <p className="mt-1 text-sm text-destructive">
                {erros.numeroPatrimonio}
              </p>
            )}
          </div>

          <CampoLocalizacao
            value={localizacao}
            onChange={(id) => {
              setLocalizacao(id);
              setErros((prev) => ({ ...prev, localizacao: undefined }));
            }}
            error={erros.localizacao}
            enabled={isOpen}
          />

          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Data de aquisição
            </label>
            <input
              type="date"
              value={dataAquisicao}
              onChange={(e) => setDataAquisicao(e.target.value)}
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            />
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

          <CamposPersonalizadosEditor
            value={camposPersonalizados}
            onChange={setCamposPersonalizados}
            error={erros.camposPersonalizados}
          />
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
              {mutation.isPending ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
