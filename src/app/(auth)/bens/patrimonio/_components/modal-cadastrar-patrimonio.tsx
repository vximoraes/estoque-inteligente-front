'use client';

// Cadastro de uma unidade de patrimônio individual — `POST /patrimonios`.
// Substitui o cadastro em lote na UI (a API ainda aceita `/patrimonios/lote`,
// mas cada bem físico agora é registrado como o card próprio que é). O
// número de patrimônio é sugerido a partir das unidades já existentes do
// modelo escolhido, mas fica sempre editável.

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
import CampoCategoria from '@/components/item-form/campo-categoria';
import CampoLocalizacao from '@/components/item-form/campo-localizacao';
import CampoImagem from '@/components/item-form/campo-imagem';
import CamposPersonalizadosEditor from '@/app/(auth)/bens/patrimonio/_components/campos-personalizados-editor';
import { sugerirNumeroPatrimonio } from '@/lib/patrimonio-numeracao';
import { useUploadImagemPatrimonio } from '@/hooks/use-upload-imagem-patrimonio';
import type {
  CampoPersonalizado,
  PatrimonioApiResponse,
  PatrimonioStatus,
} from '@/types/patrimonios';

interface PatrimonioPost {
  data: {
    _id: string;
    imagem?: string;
  };
}

interface ModalCadastrarPatrimonioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// 'Emprestado' fora de propósito: não é destino válido no cadastro (só
// entra pelo fluxo de empréstimo) — mesma regra do PatrimonioSchema da API.
const STATUS_INICIAL_OPTIONS: PatrimonioStatus[] = [
  'Disponível',
  'Manutenção',
  'Baixado',
];

export default function ModalCadastrarPatrimonio({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarPatrimonioProps) {
  const queryClient = useQueryClient();
  const [categoriaId, setCategoriaId] = useState('');
  const [numeroPatrimonio, setNumeroPatrimonio] = useState('');
  const [numeroEditadoManualmente, setNumeroEditadoManualmente] =
    useState(false);
  const [modelo, setModelo] = useState('');
  const [modeloParaSugestao, setModeloParaSugestao] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [status, setStatus] = useState<PatrimonioStatus>('Disponível');
  const [localizacao, setLocalizacao] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [camposPersonalizados, setCamposPersonalizados] = useState<
    CampoPersonalizado[]
  >([]);
  const [erros, setErros] = useState<{
    categoria?: string;
    numeroPatrimonio?: string;
    modelo?: string;
    localizacao?: string;
    camposPersonalizados?: string;
  }>({});
  const { enviar: enviarImagem } = useUploadImagemPatrimonio();

  const resetForm = () => {
    setCategoriaId('');
    setNumeroPatrimonio('');
    setNumeroEditadoManualmente(false);
    setModelo('');
    setModeloParaSugestao('');
    setFabricante('');
    setStatus('Disponível');
    setLocalizacao('');
    setDataAquisicao('');
    setObservacoes('');
    setImagem(null);
    setImagemPreview(null);
    setCamposPersonalizados([]);
    setErros({});
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  // Sugestão de número: só busca as unidades do mesmo modelo (correspondência
  // exata) quando o usuário ainda não editou o campo manualmente, pra não
  // pisar numa digitação em andamento. Dispara no blur do campo Modelo, não
  // a cada tecla — ver `onBlur` mais abaixo.
  const { data: unidadesDoModelo } = useQuery<PatrimonioApiResponse>({
    queryKey: ['patrimonios', 'sugestao-numero', modeloParaSugestao],
    queryFn: () =>
      get<PatrimonioApiResponse>(
        `/patrimonios?modelo=${encodeURIComponent(modeloParaSugestao)}&limite=100`,
      ),
    enabled: isOpen && !!modeloParaSugestao && !numeroEditadoManualmente,
  });

  useEffect(() => {
    if (numeroEditadoManualmente || !unidadesDoModelo) return;
    const sugestao = sugerirNumeroPatrimonio(unidadesDoModelo.data.docs);
    if (sugestao) setNumeroPatrimonio(sugestao);
  }, [unidadesDoModelo, numeroEditadoManualmente]);

  const mutation = useMutation({
    mutationFn: async () =>
      await post<PatrimonioPost>('/patrimonios', {
        categoria: categoriaId,
        numero_patrimonio: numeroPatrimonio.trim(),
        modelo: modelo.trim(),
        fabricante: fabricante.trim() || undefined,
        status,
        localizacao,
        data_aquisicao: dataAquisicao
          ? new Date(dataAquisicao).toISOString()
          : undefined,
        observacoes: observacoes.trim() || undefined,
        campos_personalizados: camposPersonalizados
          .map((c) => ({ chave: c.chave.trim(), valor: c.valor.trim() }))
          .filter((c) => c.chave && c.valor),
      }),
    onSuccess: (data) => {
      const novoPatrimonioId = data.data._id;
      queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
      toast.success('Unidade de patrimônio cadastrada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });

      if (imagem) {
        enviarImagem.mutate(
          { patrimonioId: novoPatrimonioId, arquivo: imagem },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
              onSuccess?.();
              onClose();
            },
            onError: () => {
              toast.error('Erro ao fazer upload da imagem.', {
                position: 'bottom-right',
                autoClose: 5000,
              });
              onSuccess?.();
              onClose();
            },
          },
        );
      } else {
        onSuccess?.();
        onClose();
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível cadastrar a unidade.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  const isPending = mutation.isPending || enviarImagem.isPending;

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
    if (!categoriaId) novosErros.categoria = 'Selecione a categoria';
    if (!numeroPatrimonio.trim()) {
      novosErros.numeroPatrimonio = 'Número de patrimônio é obrigatório';
    }
    if (!modelo.trim()) novosErros.modelo = 'Modelo é obrigatório';
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
              className={`w-full h-11 px-3 text-base md:text-sm border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 ${
                erros.numeroPatrimonio ? 'border-destructive' : 'border-border'
              }`}
            />
            {erros.numeroPatrimonio && (
              <p className="mt-1 text-sm text-destructive">
                {erros.numeroPatrimonio}
              </p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Modelo <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={modelo}
              onChange={(e) => {
                setModelo(e.target.value);
                setErros((prev) => ({ ...prev, modelo: undefined }));
              }}
              onBlur={(e) => setModeloParaSugestao(e.target.value.trim())}
              maxLength={100}
              placeholder="ThinkPad T14"
              className={`w-full h-11 px-3 text-base md:text-sm border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 ${
                erros.modelo ? 'border-destructive' : 'border-border'
              }`}
            />
            {erros.modelo && (
              <p className="mt-1 text-sm text-destructive">{erros.modelo}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              Fabricante
            </label>
            <input
              type="text"
              value={fabricante}
              onChange={(e) => setFabricante(e.target.value)}
              maxLength={100}
              placeholder="Lenovo"
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            />
          </div>

          <CampoCategoria
            value={categoriaId}
            onChange={(id) => {
              setCategoriaId(id);
              setErros((prev) => ({ ...prev, categoria: undefined }));
            }}
            tipo="permanente"
            error={erros.categoria}
            enabled={isOpen}
          />

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
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PatrimonioStatus)}
                className="w-full h-11 px-3 pr-9 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 bg-card text-foreground appearance-none"
              >
                {STATUS_INICIAL_OPTIONS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

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

          <CampoImagem
            previewUrl={imagemPreview}
            onChange={(arquivo, preview) => {
              setImagem(arquivo);
              setImagemPreview(preview);
            }}
            onRemover={() => {
              setImagem(null);
              setImagemPreview(null);
            }}
          />

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
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-11 flex-1 text-ei-accent-foreground cursor-pointer hover:opacity-90"
              style={{ backgroundColor: 'var(--ei-accent)' }}
              disabled={isPending}
            >
              {isPending ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
