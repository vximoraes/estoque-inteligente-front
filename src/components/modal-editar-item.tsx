'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import { ModalShell } from '@/components/ui/modal-shell';
import CampoCategoria from '@/components/item-form/campo-categoria';
import CampoImagem from '@/components/item-form/campo-imagem';
import { useUploadImagemItem } from '@/hooks/use-upload-imagem-item';
import { ITEM_TIPO_LABEL, type ItemTipo } from '@/types/itens';

interface ItemData {
  _id: string;
  nome: string;
  categoria: {
    _id: string;
    nome: string;
  };
  estoque_minimo: number;
  descricao?: string;
  imagem?: string;
}
interface ItemPatch {
  data: {
    _id: string;
    imagem?: string;
  };
}

interface ModalEditarItemProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  tipo: ItemTipo;
  onSuccess?: () => void;
}

export default function ModalEditarItem({
  isOpen,
  onClose,
  itemId,
  tipo,
  onSuccess,
}: ModalEditarItemProps) {
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('0');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemAtual, setImagemAtual] = useState<string | null>(null);
  const [imagemParaDeletar, setImagemParaDeletar] = useState(false);
  const [errors, setErrors] = useState<{ nome?: string; categoria?: string }>(
    {},
  );
  const queryClient = useQueryClient();
  const { enviar: enviarImagem, remover: removerImagem } =
    useUploadImagemItem();

  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      return await get<{ data: ItemData }>(`/itens/${itemId}`);
    },
    enabled: isOpen && !!itemId,
  });

  useEffect(() => {
    if (itemData?.data) {
      const item = itemData.data;
      setNome(item.nome || '');
      setCategoriaId(item.categoria._id || '');
      setEstoqueMinimo(item.estoque_minimo?.toString() || '0');
      setDescricao(item.descricao || '');
      setImagemParaDeletar(false);
      if (item.imagem) {
        const comCacheBust = `${item.imagem}${item.imagem.includes('?') ? '&' : '?'}t=${Date.now()}`;
        setImagemAtual(item.imagem);
        setImagem(null);
        setImagemPreview(comCacheBust);
      } else {
        setImagemAtual(null);
        setImagemPreview(null);
      }
    }
  }, [itemData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setErrors({});
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const finalizarComOuSemImagem = (itemIdAtualizado: string) => {
    if (imagem) {
      enviarImagem.mutate(
        { itemId: itemIdAtualizado, arquivo: imagem },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['itens'] });
            queryClient.invalidateQueries({ queryKey: ['item', itemId] });
            onSuccess?.();
            onClose();
          },
          onError: () => {
            toast.error('Erro ao atualizar a imagem do item.', {
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

  const updateItemMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await patch<ItemPatch>(`/itens/${itemId}`, data);
    },
    onSuccess: async (data) => {
      const itemIdAtualizado = data.data._id;
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });

      if (imagemParaDeletar && imagemAtual) {
        await removerImagem.mutateAsync(itemIdAtualizado, {
          onError: () => {
            toast.error('Erro ao deletar a imagem do item.', {
              position: 'bottom-right',
              autoClose: 5000,
            });
          },
        });
      }

      finalizarComOuSemImagem(itemIdAtualizado);
    },
    onError: (error: any) => {
      let errorMessage = 'Erro ao atualizar item';
      const errorData = error?.response?.data;
      if (errorData?.errors?.length) {
        errorMessage =
          errorData.errors.map((err: any) => err.message).join(', ') ||
          errorData.message ||
          errorMessage;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { position: 'bottom-right', autoClose: 5000 });
    },
  });

  const isPending = updateItemMutation.isPending || enviarImagem.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { nome?: string; categoria?: string } = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!categoriaId) newErrors.categoria = 'Selecione uma categoria';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateItemMutation.mutate({
      nome,
      categoria: categoriaId,
      estoque_minimo: estoqueMinimo,
      ...(descricao.trim() ? { descricao } : {}),
    });
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      data-test="modal-editar-item"
      zIndex={99999}
      contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="relative p-6 pb-0">
        <button
          data-test="modal-editar-item-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={20} />
        </button>
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground">Editar item</h2>
        </div>
      </div>

      {isLoadingItem ? (
        <div className="p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="w-full h-11" />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-11" />
                <Skeleton className="h-11 w-11" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="w-full h-11" />
            </div>
            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="w-full h-11" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="w-full min-h-[100px]" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 sm:space-y-6">
            {/* Tipo do item (somente leitura — imutável após a criação) */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/60"
              data-test="tipo-item-readonly"
            >
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Tipo:
              </span>
              <span className="text-sm text-muted-foreground">
                {ITEM_TIPO_LABEL[tipo]} (não pode ser alterado)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label
                    htmlFor="nome"
                    className="text-sm font-semibold text-foreground tracking-tight"
                  >
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {nome.length}/100
                  </span>
                </div>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Meu Item"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (errors.nome) {
                      setErrors((prev) => ({ ...prev, nome: undefined }));
                    }
                  }}
                  maxLength={100}
                  className={`w-full h-11 ${errors.nome ? 'border-destructive!' : ''}`}
                  data-test="input-nome-item"
                />
                {errors.nome && (
                  <p className="text-destructive text-xs sm:text-sm mt-1">
                    {errors.nome}
                  </p>
                )}
              </div>

              <CampoCategoria
                value={categoriaId}
                onChange={(id) => {
                  setCategoriaId(id);
                  if (errors.categoria) {
                    setErrors((prev) => ({ ...prev, categoria: undefined }));
                  }
                }}
                tipo={tipo}
                error={errors.categoria}
                enabled={isOpen}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
              {tipo !== 'permanente' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label
                      htmlFor="estoqueMinimo"
                      className="text-sm font-semibold text-foreground tracking-tight"
                    >
                      Estoque mínimo
                    </Label>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {estoqueMinimo.length}/9
                    </span>
                  </div>
                  <Input
                    id="estoqueMinimo"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={estoqueMinimo}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 9) setEstoqueMinimo(value);
                    }}
                    className="w-full h-11"
                    data-test="input-estoque-minimo"
                  />
                </div>
              )}

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
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <Label
                  htmlFor="descricao"
                  className="text-sm font-semibold text-foreground tracking-tight"
                >
                  Descrição
                </Label>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {descricao.length}/200
                </span>
              </div>
              <textarea
                id="descricao"
                placeholder="Item para projeto..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none min-h-[100px] bg-card"
                data-test="textarea-descricao-item"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                className="h-11 flex-1 cursor-pointer"
                data-test="botao-cancelar"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: 'var(--ei-accent)' }}
                data-test="botao-salvar"
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
