'use client';

// Cadastro de um MODELO de bem permanente (`Item` com tipo 'permanente') —
// não de uma unidade física. Cada unidade individual (com número de
// patrimônio próprio) é cadastrada depois via `ModalCadastrarPatrimonio`,
// que referencia o modelo criado aqui. Chamado a partir do "+" do
// `CampoItem`, no meio do formulário de cadastro de patrimônio.

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
import CampoImagem from '@/components/item-form/campo-imagem';
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
  onSuccess?: (item: { id: string; nome: string }) => void;
}

export default function ModalCadastrarItemPatrimonio({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarItemPatrimonioProps) {
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    nome?: string;
    categoria?: string;
  }>({});
  const queryClient = useQueryClient();
  const { enviar: enviarImagem } = useUploadImagemItem();

  const resetForm = () => {
    setNome('');
    setCategoriaId('');
    setDescricao('');
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

  const finalizarComOuSemImagem = (novoItemId: string) => {
    if (imagem) {
      enviarImagem.mutate(
        { itemId: novoItemId, arquivo: imagem },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['itens'] });
            onSuccess?.({ id: novoItemId, nome });
            onClose();
          },
          onError: () => {
            toast.error('Erro ao fazer upload da imagem.', {
              position: 'bottom-right',
              autoClose: 5000,
            });
            onSuccess?.({ id: novoItemId, nome });
            onClose();
          },
        },
      );
    } else {
      onSuccess?.({ id: novoItemId, nome });
      onClose();
    }
  };

  const createItemMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await post<ItemPost>('/itens', data);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      finalizarComOuSemImagem(data.data._id);
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

  const isPending = createItemMutation.isPending || enviarImagem.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!categoriaId) newErrors.categoria = 'Selecione uma categoria';

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
            Novo modelo de bem permanente
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre o modelo antes de registrar unidades individuais dele.
          </p>
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
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
