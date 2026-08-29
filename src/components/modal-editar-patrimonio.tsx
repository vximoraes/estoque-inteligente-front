'use client';

// Edição de metadados de uma unidade patrimonial — `PATCH /patrimonios/:id`.
// Só número de patrimônio, data de aquisição, observações e campos
// personalizados: status e localização têm rotas próprias (transição e
// transferência), para garantir que toda mudança de estado gere um
// PatrimonioEvento. Radix Dialog aninhado, mesmo motivo de
// `modal-patrimonio-status.tsx`: abre por cima do detalhe sem fechá-lo.

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
import CampoCategoria from '@/components/item-form/campo-categoria';
import CampoImagem from '@/components/item-form/campo-imagem';
import CamposPersonalizadosEditor from '@/components/campos-personalizados-editor';
import { useUploadImagemPatrimonio } from '@/hooks/use-upload-imagem-patrimonio';
import type { CampoPersonalizado, PatrimonioData } from '@/types/patrimonios';

interface ModalEditarPatrimonioProps {
  isOpen: boolean;
  onClose: () => void;
  patrimonio: PatrimonioData;
  onSuccess?: () => void;
}

function formatarDataInput(data?: string) {
  if (!data) return '';
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

export default function ModalEditarPatrimonio({
  isOpen,
  onClose,
  patrimonio,
  onSuccess,
}: ModalEditarPatrimonioProps) {
  const queryClient = useQueryClient();
  const [numeroPatrimonio, setNumeroPatrimonio] = useState('');
  const [modelo, setModelo] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemAtual, setImagemAtual] = useState<string | null>(null);
  const [imagemParaDeletar, setImagemParaDeletar] = useState(false);
  const [camposPersonalizados, setCamposPersonalizados] = useState<
    CampoPersonalizado[]
  >([]);
  const [erros, setErros] = useState<{
    numeroPatrimonio?: string;
    categoria?: string;
    camposPersonalizados?: string;
  }>({});
  const { enviar: enviarImagem, remover: removerImagem } =
    useUploadImagemPatrimonio();

  useEffect(() => {
    if (!isOpen) return;
    setNumeroPatrimonio(patrimonio.numero_patrimonio);
    setModelo(patrimonio.modelo ?? '');
    setFabricante(patrimonio.fabricante ?? '');
    setCategoriaId(patrimonio.categoria._id);
    setDataAquisicao(formatarDataInput(patrimonio.data_aquisicao));
    setObservacoes(patrimonio.observacoes ?? '');
    setCamposPersonalizados(patrimonio.campos_personalizados ?? []);
    setErros({});
    setImagemParaDeletar(false);
    if (patrimonio.imagem) {
      const comCacheBust = `${patrimonio.imagem}${patrimonio.imagem.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setImagemAtual(patrimonio.imagem);
      setImagem(null);
      setImagemPreview(comCacheBust);
    } else {
      setImagemAtual(null);
      setImagem(null);
      setImagemPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patrimonio._id]);

  const finalizarComOuSemImagem = () => {
    if (imagem) {
      enviarImagem.mutate(
        { patrimonioId: patrimonio._id, arquivo: imagem },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
            onSuccess?.();
            onClose();
          },
          onError: () => {
            toast.error('Erro ao atualizar a imagem da unidade.', {
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
  };

  const mutation = useMutation({
    mutationFn: async () =>
      await patch(`/patrimonios/${patrimonio._id}`, {
        numero_patrimonio: numeroPatrimonio.trim(),
        modelo: modelo.trim() || undefined,
        fabricante: fabricante.trim() || undefined,
        categoria: categoriaId,
        data_aquisicao: dataAquisicao
          ? new Date(dataAquisicao).toISOString()
          : undefined,
        observacoes: observacoes.trim() || undefined,
        campos_personalizados: camposPersonalizados
          .map((c) => ({ chave: c.chave.trim(), valor: c.valor.trim() }))
          .filter((c) => c.chave && c.valor),
      }),
    onSuccess: async () => {
      // Prefixo amplo: alcança tanto a grade quanto o detalhe já aberto.
      queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
      toast.success(`${numeroPatrimonio} atualizado com sucesso!`, {
        position: 'bottom-right',
        autoClose: 3000,
      });

      if (imagemParaDeletar && imagemAtual) {
        await removerImagem.mutateAsync(patrimonio._id, {
          onError: () => {
            toast.error('Erro ao deletar a imagem da unidade.', {
              position: 'bottom-right',
              autoClose: 5000,
            });
          },
        });
      }

      finalizarComOuSemImagem();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível atualizar a unidade.', {
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
    if (!numeroPatrimonio.trim()) {
      novosErros.numeroPatrimonio = 'Número de patrimônio é obrigatório';
    }
    if (!categoriaId) {
      novosErros.categoria = 'Selecione a categoria';
    }
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
        data-test="modal-editar-patrimonio"
      >
        <DialogHeader>
          <DialogTitle>Editar unidade</DialogTitle>
          <DialogDescription>
            {patrimonio.modelo || patrimonio.numero_patrimonio}
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
                setErros((prev) => ({
                  ...prev,
                  numeroPatrimonio: undefined,
                }));
              }}
              maxLength={60}
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
              Modelo
            </label>
            <input
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              maxLength={100}
              className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            />
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
              setImagemParaDeletar(false);
            }}
            onRemover={() => {
              setImagem(null);
              setImagemPreview(null);
              if (imagemAtual) setImagemParaDeletar(true);
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
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
