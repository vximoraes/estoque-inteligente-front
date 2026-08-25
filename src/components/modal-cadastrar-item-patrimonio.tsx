'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import { ModalShell } from '@/components/ui/modal-shell';
import CampoCategoria from '@/components/item-form/campo-categoria';
import CampoLocalizacao from '@/components/item-form/campo-localizacao';
import CampoImagem from '@/components/item-form/campo-imagem';
import ModalPatrimonioAdicionarUnidades from '@/components/modal-patrimonio-adicionar-unidades';
import { useUploadImagemItem } from '@/hooks/use-upload-imagem-item';

interface ItemPost {
  data: {
    _id: string;
    imagem?: string;
  };
}

interface ModalCadastrarItemPatrimonioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ModalCadastrarItemPatrimonio({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarItemPatrimonioProps) {
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localizacaoInicial, setLocalizacaoInicial] = useState('');
  const [quantidadeUnidades, setQuantidadeUnidades] = useState('1');
  const [prefixoPatrimonio, setPrefixoPatrimonio] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    nome?: string;
    categoria?: string;
    localizacaoInicial?: string;
    quantidadeUnidades?: string;
    prefixoPatrimonio?: string;
  }>({});
  const queryClient = useQueryClient();
  const { enviar: enviarImagem } = useUploadImagemItem();

  // Retentativa do lote: se `POST /patrimonios/lote` falhar após o item já
  // ter sido criado, este modal fecha e abre o de "adicionar unidades" já
  // preenchido com o item recém-criado, em vez de deixar o usuário órfão.
  const [itemParaRetentativa, setItemParaRetentativa] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  const resetForm = () => {
    setNome('');
    setCategoriaId('');
    setDescricao('');
    setLocalizacaoInicial('');
    setQuantidadeUnidades('1');
    setPrefixoPatrimonio('');
    setImagem(null);
    setImagemPreview(null);
    setErrors({});
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      document.body.style.overflow = 'hidden';
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

  const createPatrimonioLoteMutation = useMutation({
    mutationFn: async (payload: {
      item: string;
      localizacao: string;
      quantidade: number;
      prefixo: string;
      numero_inicial: number;
    }) => {
      return await post('/patrimonios/lote', payload);
    },
  });

  const finalizarComOuSemImagem = (novoItemId: string) => {
    if (imagem) {
      enviarImagem.mutate(
        { itemId: novoItemId, arquivo: imagem },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['itens'] });
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
  };

  const createItemMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await post<ItemPost>('/itens', data);
    },
    onSuccess: async (data) => {
      const novoItemId = data.data._id;
      queryClient.invalidateQueries({ queryKey: ['itens'] });

      try {
        await createPatrimonioLoteMutation.mutateAsync({
          item: novoItemId,
          localizacao: localizacaoInicial,
          quantidade: Number(quantidadeUnidades),
          prefixo: prefixoPatrimonio.trim(),
          numero_inicial: 1,
        });
        queryClient.invalidateQueries({ queryKey: ['itens'] });
        finalizarComOuSemImagem(novoItemId);
      } catch (error: any) {
        toast.error(
          `Item criado, mas as unidades não puderam ser cadastradas: ${
            error?.message || 'erro desconhecido'
          }. Complete o cadastro das unidades a seguir.`,
          { position: 'bottom-right', autoClose: 8000 },
        );
        setItemParaRetentativa({ id: novoItemId, nome });
      }
    },
    onError: (error: any) => {
      let errorMessage = 'Erro ao criar item';
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

  const isPending =
    createItemMutation.isPending ||
    createPatrimonioLoteMutation.isPending ||
    enviarImagem.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!categoriaId) newErrors.categoria = 'Selecione uma categoria';
    if (!localizacaoInicial) {
      newErrors.localizacaoInicial = 'Selecione a localização das unidades';
    }
    const quantidadeNumero = Number(quantidadeUnidades);
    if (
      !quantidadeUnidades ||
      !Number.isInteger(quantidadeNumero) ||
      quantidadeNumero < 1 ||
      quantidadeNumero > 500
    ) {
      newErrors.quantidadeUnidades = 'Informe de 1 a 500 unidades';
    }
    if (!prefixoPatrimonio.trim()) {
      newErrors.prefixoPatrimonio = 'Prefixo é obrigatório';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createItemMutation.mutate({
      nome,
      tipo: 'permanente',
      categoria: categoriaId,
      estoque_minimo: '0',
      ...(descricao.trim() ? { descricao } : {}),
    });
  };

  const modalContent = (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        data-test="modal-cadastrar-item-patrimonio"
        zIndex={99999}
        contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="relative p-6 pb-0">
          <button
            data-test="modal-cadastrar-item-close"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
          <div className="text-center pt-4 px-8">
            <h2 className="text-xl font-semibold text-foreground">
              Adicionar bem permanente
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 sm:space-y-6">
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
                  placeholder="Notebook Dell"
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
                tipo="permanente"
                error={errors.categoria}
                enabled={isOpen}
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <CampoLocalizacao
                value={localizacaoInicial}
                onChange={(id) => {
                  setLocalizacaoInicial(id);
                  if (errors.localizacaoInicial) {
                    setErrors((prev) => ({
                      ...prev,
                      localizacaoInicial: undefined,
                    }));
                  }
                }}
                error={errors.localizacaoInicial}
                label="Localização das unidades"
                enabled={isOpen}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label
                    htmlFor="quantidadeUnidades"
                    className="text-sm font-semibold text-foreground tracking-tight mb-2 block"
                  >
                    Quantidade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantidadeUnidades"
                    type="number"
                    min="1"
                    max="500"
                    placeholder="1"
                    value={quantidadeUnidades}
                    onChange={(e) => {
                      setQuantidadeUnidades(e.target.value);
                      if (errors.quantidadeUnidades) {
                        setErrors((prev) => ({
                          ...prev,
                          quantidadeUnidades: undefined,
                        }));
                      }
                    }}
                    className={`w-full h-11 ${errors.quantidadeUnidades ? 'border-destructive!' : ''}`}
                    data-test="input-quantidade-unidades"
                  />
                  {errors.quantidadeUnidades && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">
                      {errors.quantidadeUnidades}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="prefixoPatrimonio"
                    className="text-sm font-semibold text-foreground tracking-tight mb-2 block"
                  >
                    Prefixo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="prefixoPatrimonio"
                    type="text"
                    placeholder="NB"
                    value={prefixoPatrimonio}
                    onChange={(e) => {
                      setPrefixoPatrimonio(e.target.value.toUpperCase());
                      if (errors.prefixoPatrimonio) {
                        setErrors((prev) => ({
                          ...prev,
                          prefixoPatrimonio: undefined,
                        }));
                      }
                    }}
                    maxLength={10}
                    className={`w-full h-11 ${errors.prefixoPatrimonio ? 'border-destructive!' : ''}`}
                    data-test="input-prefixo-patrimonio"
                  />
                  {errors.prefixoPatrimonio && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">
                      {errors.prefixoPatrimonio}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                As unidades serão numeradas {prefixoPatrimonio || 'PREFIXO'}
                -0001, {prefixoPatrimonio || 'PREFIXO'}-0002...
              </p>
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
      </ModalShell>

      {itemParaRetentativa && (
        <ModalPatrimonioAdicionarUnidades
          isOpen
          onClose={() => {
            setItemParaRetentativa(null);
            onSuccess?.();
            onClose();
          }}
          itemId={itemParaRetentativa.id}
          itemNome={itemParaRetentativa.nome}
          unidadesExistentes={[]}
          onSuccess={() => {
            setItemParaRetentativa(null);
            finalizarComOuSemImagem(itemParaRetentativa.id);
          }}
        />
      )}
    </>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
