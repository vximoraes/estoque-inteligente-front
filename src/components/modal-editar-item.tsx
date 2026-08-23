'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import ModalEditarCategoria from '@/components/modal-editar-categoria';
import ModalExcluirCategoria from '@/components/modal-excluir-categoria';
import { ModalShell } from '@/components/ui/modal-shell';
import type { Categoria, CategoriaApiResponse } from '@/types/categorias';

interface ItemData {
  _id: string;
  nome: string;
  tipo: 'consumo' | 'permanente';
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
  onSuccess?: () => void;
}

export default function ModalEditarItem({
  isOpen,
  onClose,
  itemId,
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
  const [isAddingCategoria, setIsAddingCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaCategoriaDescricao, setNovaCategoriaDescricao] = useState('');
  const [isCategoriaDropdownOpen, setIsCategoriaDropdownOpen] = useState(false);
  const [categoriaPesquisa, setCategoriaPesquisa] = useState('');
  const [errors, setErrors] = useState<{
    nome?: string;
    categoria?: string;
    novaCategoria?: string;
  }>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isEditarCategoriaModalOpen, setIsEditarCategoriaModalOpen] =
    useState(false);
  const [isExcluirCategoriaModalOpen, setIsExcluirCategoriaModalOpen] =
    useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(
    null,
  );

  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      return await get<{ data: ItemData }>(`/itens/${itemId}`);
    },
    enabled: isOpen && !!itemId,
  });

  const { data: categoriasData, isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      return await get<CategoriaApiResponse>(`/categorias?limite=100&page=1`);
    },
    enabled: isOpen,
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
        setImagemAtual(item.imagem);
        setImagem(null);
        setImagemPreview(item.imagem);
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
      setIsAddingCategoria(false);
      setNovaCategoria('');
      setNovaCategoriaDescricao('');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const createCategoriaMutation = useMutation({
    mutationFn: async (dados: { nome: string; descricao?: string }) => {
      return await post('/categorias', dados);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setCategoriaId(data.data._id);
      setNovaCategoria('');
      setNovaCategoriaDescricao('');
      setIsAddingCategoria(false);
      setErrors((prev) => ({ ...prev, novaCategoria: undefined }));
      toast.success('Categoria criada com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message;
      setErrors((prev) => ({ ...prev, novaCategoria: errorMessage }));
    },
  });

  const deleteItemImagem = useMutation({
    mutationFn: async (itemIdParam: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/itens/${itemIdParam}/foto`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      return await response.json();
    },
    onSuccess: () => {
      setImagemAtual(null);
      setImagemPreview(null);
      setImagemParaDeletar(false);
    },
    onError: (error: any) => {
      console.error('Erro ao deletar imagem:', error);
      toast.error('Erro ao deletar a imagem do item.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  const sendItemImagem = useMutation({
    mutationFn: async (itemIdParam: string) => {
      if (imagem) {
        const formData = new FormData();
        formData.append('file', imagem);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/itens/${itemIdParam}/foto`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          },
        );
        return await response.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao atualizar a imagem do item.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      onSuccess?.();
      onClose();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await patch<ItemPatch>(`/itens/${itemId}`, data);
    },
    onSuccess: async (data: any) => {
      const itemIdAtualizado = data.data._id;
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });

      if (imagemParaDeletar && imagemAtual) {
        await deleteItemImagem.mutateAsync(itemIdAtualizado);
      }

      if (imagem) {
        sendItemImagem.mutate(itemIdAtualizado);
      } else {
        onSuccess?.();
        onClose();
      }
    },
    onError: (error: any) => {
      let errorMessage = 'Erro ao atualizar item';

      if (error?.response?.data) {
        const errorData = error.response.data;

        if (
          errorData.errors &&
          Array.isArray(errorData.errors) &&
          errorData.errors.length > 0
        ) {
          const messages = errorData.errors
            .map((err: any) => err.message)
            .filter(Boolean);
          if (messages.length > 0) {
            errorMessage = messages.join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagem(file);
      setImagemParaDeletar(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagem(null);
    setImagemPreview(null);
    if (imagemAtual) {
      setImagemParaDeletar(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImagem(file);
        setImagemParaDeletar(false);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagemPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { nome?: string; categoria?: string } = {};

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!categoriaId) {
      newErrors.categoria = 'Selecione uma categoria';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const itemDataPayload: any = {
      nome: nome,
      categoria: categoriaId,
      estoque_minimo: estoqueMinimo,
    };

    if (descricao.trim()) {
      itemDataPayload.descricao = descricao;
    }

    updateItemMutation.mutate(itemDataPayload);
  };

  const handleAddCategoria = () => {
    if (!novaCategoria.trim()) {
      setErrors((prev) => ({
        ...prev,
        novaCategoria: 'Nome da categoria é obrigatório',
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, novaCategoria: undefined }));
    createCategoriaMutation.mutate({
      nome: novaCategoria,
      descricao: novaCategoriaDescricao.trim() || undefined,
    });
  };

  const handleCategoriaSelect = (categoria: Categoria) => {
    setCategoriaId(categoria._id);
    setIsCategoriaDropdownOpen(false);
    setCategoriaPesquisa('');
    if (errors.categoria) {
      setErrors((prev) => ({ ...prev, categoria: undefined }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-categoria-dropdown]')) {
        setIsCategoriaDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const categorias = categoriasData?.data?.docs ?? [];
  const categoriasFiltradas = categorias.filter((cat: Categoria) =>
    cat.nome.toLowerCase().includes(categoriaPesquisa.toLowerCase()),
  );
  const categoriaSelecionada = categorias.find(
    (cat: Categoria) => cat._id === categoriaId,
  );

  const isPending = updateItemMutation.isPending || sendItemImagem.isPending;

  const modalContent = (
    <>
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
            <h2 className="text-xl font-semibold text-foreground">
              Editar item
            </h2>
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
                  {itemData?.data?.tipo === 'permanente'
                    ? 'Bem permanente'
                    : 'Material de consumo'}{' '}
                  (não pode ser alterado)
                </span>
              </div>

              {/* Grid de 2 colunas */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                {/* Nome */}
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

                {/* Categoria com botão + */}
                <div>
                  <Label className="text-sm font-semibold text-foreground tracking-tight mb-2 block">
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <div
                        className="relative flex-1 min-w-0"
                        data-categoria-dropdown
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriaDropdownOpen(
                              !isCategoriaDropdownOpen,
                            );
                            if (errors.categoria) {
                              setErrors((prev) => ({
                                ...prev,
                                categoria: undefined,
                              }));
                            }
                          }}
                          className={`w-full h-11 flex items-center justify-between px-3 bg-card border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors cursor-pointer ${
                            errors.categoria
                              ? 'border-destructive'
                              : 'border-border'
                          }`}
                          disabled={isLoadingCategorias}
                          data-test="botao-selecionar-categoria"
                        >
                          <span
                            className={`truncate ${categoriaSelecionada ? 'text-foreground' : 'text-muted-foreground'}`}
                          >
                            {isLoadingCategorias
                              ? 'Carregando...'
                              : categoriaSelecionada?.nome ||
                                'Selecione uma categoria'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
                              isCategoriaDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isCategoriaDropdownOpen && !isLoadingCategorias && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 sm:max-h-80 overflow-hidden flex flex-col">
                            <div className="p-2 sm:p-3 border-b border-border bg-muted">
                              <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={categoriaPesquisa}
                                onChange={(e) =>
                                  setCategoriaPesquisa(e.target.value)
                                }
                                className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent"
                                onClick={(e) => e.stopPropagation()}
                                data-test="input-pesquisa-categoria"
                              />
                            </div>

                            <div className="overflow-y-auto">
                              {categoriasFiltradas.length > 0 ? (
                                <>
                                  {categoriasFiltradas.map(
                                    (categoria: Categoria) => (
                                      <div
                                        key={categoria._id}
                                        className={`flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-muted transition-colors group ${
                                          categoriaId === categoria._id
                                            ? 'bg-[var(--ei-accent)]/10'
                                            : ''
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCategoriaSelect(categoria)
                                          }
                                          className={`flex-1 text-left cursor-pointer text-sm sm:text-base truncate ${
                                            categoriaId === categoria._id
                                              ? 'text-[var(--ei-accent)] font-medium'
                                              : 'text-foreground'
                                          }`}
                                          title={categoria.nome}
                                          data-test="categoria-option"
                                        >
                                          {categoria.nome}
                                        </button>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCategoriaToEdit(categoria);
                                              setIsEditarCategoriaModalOpen(
                                                true,
                                              );
                                            }}
                                            className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                                            title="Editar categoria"
                                            data-test="botao-editar-categoria"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCategoriaToEdit(categoria);
                                              setIsExcluirCategoriaModalOpen(
                                                true,
                                              );
                                            }}
                                            className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                                            title="Excluir categoria"
                                            data-test="botao-excluir-categoria"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </>
                              ) : (
                                <div className="px-4 py-6 sm:py-8 text-center text-muted-foreground text-xs sm:text-sm">
                                  Nenhuma categoria encontrada
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setIsAddingCategoria(true)}
                        className="text-ei-accent-foreground h-11! w-11! p-0! flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
                        style={{ backgroundColor: 'var(--ei-accent)' }}
                        data-test="botao-adicionar-categoria"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {errors.categoria && (
                      <p className="text-destructive text-xs sm:text-sm">
                        {errors.categoria}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de 2 colunas */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                {itemData?.data?.tipo !== 'permanente' && (
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
                        if (value.length <= 9) {
                          setEstoqueMinimo(value);
                        }
                      }}
                      className="w-full h-11"
                      data-test="input-estoque-minimo"
                    />
                  </div>
                )}

                {/* Imagem */}
                <div>
                  <Label className="text-sm font-semibold text-foreground tracking-tight mb-2 block">
                    Imagem
                  </Label>
                  {imagemPreview ? (
                    <div className="relative border-2 border-dashed border-border rounded-md min-h-11 flex items-center px-2 sm:px-3 bg-muted">
                      <div className="flex items-center gap-2 sm:gap-3 w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={
                              imagemPreview.startsWith('data:')
                                ? imagemPreview
                                : `${imagemPreview}${imagemPreview.includes('?') ? '&' : '?'}t=${Date.now()}`
                            }
                            alt="Preview"
                            className="h-6 w-6 sm:h-8 sm:w-8 object-cover rounded-md"
                            key={imagemPreview}
                          />
                          <span className="text-xs sm:text-sm text-foreground truncate">
                            Imagem selecionada
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="shrink-0 flex items-center justify-center cursor-pointer"
                          aria-label="Remover imagem"
                          data-test="botao-remover-imagem"
                        >
                          <X
                            className="w-4 h-4 text-muted-foreground"
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-md min-h-11 flex items-center justify-center px-3 sm:px-4 transition-all cursor-pointer ${
                        isDragging
                          ? 'border-[var(--ei-accent)] bg-[var(--ei-accent)]/10'
                          : 'border-border bg-muted/40 hover:bg-muted hover:border-foreground/30'
                      }`}
                    >
                      <p className="text-center text-xs sm:text-sm">
                        <span className="font-semibold text-[var(--ei-accent)]">
                          Adicione ou arraste
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {' '}
                          sua imagem aqui.
                        </span>
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    name="file"
                  />
                </div>
              </div>

              {/* Descrição - largura total */}
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

            {/* Footer com ações */}
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

      {/* Modal para adicionar categoria */}
      {isAddingCategoria && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-3 sm:p-4 bg-black/20 backdrop-blur-sm"
          style={{
            zIndex: 100000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddingCategoria(false);
              setNovaCategoria('');
              setNovaCategoriaDescricao('');
              setErrors((prev) => ({ ...prev, novaCategoria: undefined }));
            }
          }}
        >
          <div
            className="bg-card rounded-md shadow-xl max-w-lg w-full max-h-[80vh] overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-4 sm:p-6 pb-0">
              <button
                onClick={() => {
                  setIsAddingCategoria(false);
                  setNovaCategoria('');
                  setNovaCategoriaDescricao('');
                  setErrors((prev) => ({ ...prev, novaCategoria: undefined }));
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                title="Fechar"
                data-test="botao-fechar-modal-categoria"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
              <div className="text-center pt-2 sm:pt-4">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                  Nova Categoria
                </h2>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="novaCategoria"
                    className="block text-sm font-semibold text-foreground tracking-tight"
                  >
                    Nome da Categoria{' '}
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {novaCategoria.length}/100
                  </span>
                </div>
                <input
                  id="novaCategoria"
                  type="text"
                  placeholder="Digite o nome da categoria"
                  value={novaCategoria}
                  onChange={(e) => {
                    setNovaCategoria(e.target.value);
                    if (errors.novaCategoria) {
                      setErrors((prev) => ({
                        ...prev,
                        novaCategoria: undefined,
                      }));
                    }
                  }}
                  maxLength={100}
                  className={`w-full h-11 px-3 bg-card border rounded-md hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors ${
                    errors.novaCategoria
                      ? 'border-destructive'
                      : 'border-border'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategoria();
                    }
                  }}
                  data-test="input-nova-categoria"
                />
                {errors.novaCategoria && (
                  <p className="text-destructive text-xs sm:text-sm">
                    {errors.novaCategoria}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="novaCategoriaDescricao"
                    className="block text-sm font-semibold text-foreground tracking-tight"
                  >
                    Descrição
                  </label>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {novaCategoriaDescricao.length}/200
                  </span>
                </div>
                <input
                  id="novaCategoriaDescricao"
                  type="text"
                  placeholder="Breve descrição da categoria (opcional)"
                  value={novaCategoriaDescricao}
                  onChange={(e) => setNovaCategoriaDescricao(e.target.value)}
                  maxLength={200}
                  className="w-full h-11 px-3 bg-card border border-border rounded-md hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                  data-test="input-nova-categoria-descricao"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted rounded-b-md">
              <div className="flex gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingCategoria(false);
                    setNovaCategoria('');
                    setNovaCategoriaDescricao('');
                    setErrors((prev) => ({
                      ...prev,
                      novaCategoria: undefined,
                    }));
                  }}
                  disabled={createCategoriaMutation.isPending}
                  className="h-11 flex-1 cursor-pointer text-sm sm:text-base"
                  data-test="botao-cancelar-modal-categoria"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddCategoria}
                  disabled={createCategoriaMutation.isPending}
                  className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer text-sm sm:text-base"
                  style={{ backgroundColor: 'var(--ei-accent)' }}
                  data-test="botao-criar-categoria"
                >
                  {createCategoriaMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Categoria */}
      {categoriaToEdit && (
        <>
          <ModalEditarCategoria
            isOpen={isEditarCategoriaModalOpen}
            onClose={() => {
              setIsEditarCategoriaModalOpen(false);
              setCategoriaToEdit(null);
            }}
            categoriaId={categoriaToEdit._id}
            categoriaNome={categoriaToEdit.nome}
            categoriaDescricao={categoriaToEdit.descricao}
            onSuccess={() => setIsCategoriaDropdownOpen(false)}
          />
          <ModalExcluirCategoria
            isOpen={isExcluirCategoriaModalOpen}
            onClose={() => {
              setIsExcluirCategoriaModalOpen(false);
              setCategoriaToEdit(null);
            }}
            categoriaId={categoriaToEdit._id}
            categoriaNome={categoriaToEdit.nome}
            onSuccess={() => setIsCategoriaDropdownOpen(false)}
          />
        </>
      )}
    </>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
