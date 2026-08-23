import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';
import ModalEditarLocalizacao from './modal-editar-localizacao';
import ModalExcluirLocalizacao from './modal-excluir-localizacao';
import { PulseLoader } from 'react-spinners';
import type { Localizacao } from '@/types/itens';

interface LocalizacoesApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: Localizacao[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
  errors: any[];
}

interface MovimentacaoRequest {
  tipo: 'entrada';
  quantidade: string;
  item: string;
  localizacao: string;
}

interface EstoqueApiResponse {
  data: {
    docs: any[];
  };
}

interface ModalEntradaItemProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  onSuccess?: () => void;
}

export default function ModalEntradaItem({
  isOpen,
  onClose,
  itemId,
  itemNome,
  onSuccess,
}: ModalEntradaItemProps) {
  const queryClient = useQueryClient();
  const [quantidade, setQuantidade] = useState('');
  const [localizacaoSelecionada, setLocalizacaoSelecionada] =
    useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localizacaoPesquisa, setLocalizacaoPesquisa] = useState('');
  const [errors, setErrors] = useState<{
    quantidade?: string;
    localizacao?: string;
    novaLocalizacao?: string;
  }>({});
  const [isAddingLocalizacao, setIsAddingLocalizacao] = useState(false);
  const [novaLocalizacao, setNovaLocalizacao] = useState('');
  const [novaLocalizacaoDescricao, setNovaLocalizacaoDescricao] =
    useState('');
  const [isEditarLocalizacaoModalOpen, setIsEditarLocalizacaoModalOpen] =
    useState(false);
  const [isExcluirLocalizacaoModalOpen, setIsExcluirLocalizacaoModalOpen] =
    useState(false);
  const [localizacaoToEdit, setLocalizacaoToEdit] =
    useState<Localizacao | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const autoSelecionouLocalizacao = useRef(false);

  const {
    data: localizacoesData,
    isLoading: isLoadingLocalizacoes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['localizacoes-infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return await get<LocalizacoesApiResponse>(
        `/localizacoes?limite=20&page=${pageParam}`,
      );
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: isOpen,
  });

  const { data: estoquesData } = useQuery<EstoqueApiResponse>({
    queryKey: ['estoques', itemId],
    queryFn: async () => {
      return await get<EstoqueApiResponse>(`/estoques/item/${itemId}`);
    },
    enabled: isOpen && !!itemId,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const createLocalizacaoMutation = useMutation({
    mutationFn: async (dados: { nome: string; descricao?: string }) => {
      return await post('/localizacoes', dados);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['localizacoes'] });
      queryClient.invalidateQueries({ queryKey: ['localizacoes-infinite'] });
      setLocalizacaoSelecionada(data.data._id);
      setNovaLocalizacao('');
      setNovaLocalizacaoDescricao('');
      setIsAddingLocalizacao(false);
      setErrors((prev) => ({ ...prev, novaLocalizacao: undefined }));
      toast.success('Localização criada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message;
      setErrors((prev) => ({ ...prev, novaLocalizacao: errorMessage }));
    },
  });

  const entradaMutation = useMutation({
    mutationFn: async (data: MovimentacaoRequest) => {
      return await post('/movimentacoes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['itens'],
      });

      queryClient.removeQueries({
        queryKey: ['estoques', itemId],
      });

      setQuantidade('');
      setLocalizacaoSelecionada('');
      setErrors({});
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao registrar entrada:', error);
      if (error?.response?.data) {
        console.error('Resposta da API:', error.response.data);

        const errorData = error.response.data;
        let errorMessage = 'Não foi possível registrar a entrada';

        console.log('errorData completo:', JSON.stringify(errorData));
        console.log('errorData.errors:', errorData.errors);

        if (
          errorData.errors &&
          Array.isArray(errorData.errors) &&
          errorData.errors.length > 0
        ) {
          const messages = errorData.errors
            .map((err: any) => err.message)
            .filter(Boolean);
          console.log('mensagens extraídas:', messages);
          if (messages.length > 0) {
            errorMessage = messages.join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        console.log('mensagem final do toast:', errorMessage);

        toast.error(errorMessage, {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error('Não foi possível registrar a entrada.', {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuantidade('');
      setLocalizacaoSelecionada('');
      setErrors({});
      setIsDropdownOpen(false);
      autoSelecionouLocalizacao.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || autoSelecionouLocalizacao.current) return;
    if (estoquesData === undefined) return;

    autoSelecionouLocalizacao.current = true;

    const estoques = (estoquesData?.data?.docs || []).filter(
      (e: any) => e.localizacao?.ativo !== false && e.quantidade > 0,
    );
    if (estoques.length === 0) return;

    const estoqueComMaisQuantidade = [...estoques].sort(
      (a: any, b: any) => (b.quantidade || 0) - (a.quantidade || 0),
    )[0];

    if (estoqueComMaisQuantidade?.localizacao?._id) {
      setLocalizacaoSelecionada(estoqueComMaisQuantidade.localizacao._id);
    }
  }, [isOpen, estoquesData]);

  useEffect(() => {
    if (!observerTarget.current || !isDropdownOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [isDropdownOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const localizacoes = localizacoesData?.pages
    ? localizacoesData.pages.flatMap((page) => page.data.docs)
    : [];
  const estoques = estoquesData?.data?.docs || [];
  const localizacoesFiltradas = localizacoes.filter((loc: Localizacao) =>
    loc.nome.toLowerCase().includes(localizacaoPesquisa.toLowerCase()),
  );
  const localizacaoSelecionadaObj = localizacoes.find(
    (loc) => loc._id === localizacaoSelecionada,
  );

  const getQuantidadeDisponivel = (localizacaoId: string): number => {
    const estoque = estoques.find(
      (e: any) => e.localizacao._id === localizacaoId,
    );
    return estoque?.quantidade || 0;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setQuantidade(value);
      if (errors.quantidade) {
        setErrors((prev) => ({ ...prev, quantidade: undefined }));
      }
    }
  };

  const handleLocalizacaoSelect = (localizacao: Localizacao) => {
    setLocalizacaoSelecionada(localizacao._id);
    setIsDropdownOpen(false);
    setLocalizacaoPesquisa('');
    if (errors.localizacao) {
      setErrors((prev) => ({ ...prev, localizacao: undefined }));
    }
  };

  const handleAddLocalizacao = () => {
    if (!novaLocalizacao.trim()) {
      setErrors((prev) => ({
        ...prev,
        novaLocalizacao: 'Nome da localização é obrigatório',
      }));
      return;
    }
    createLocalizacaoMutation.mutate({
      nome: novaLocalizacao.trim(),
      descricao: novaLocalizacaoDescricao.trim() || undefined,
    });
  };

  const validateForm = () => {
    const newErrors: { quantidade?: string; localizacao?: string } = {};

    if (!quantidade || quantidade === '0') {
      newErrors.quantidade = 'Quantidade deve ser maior que 0';
    }

    if (!localizacaoSelecionada) {
      newErrors.localizacao = 'Selecionar localização';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (!itemId) {
      setErrors({ ...errors, quantidade: 'ID do item não encontrado' });
      return;
    }

    if (!quantidade || quantidade.trim() === '') {
      setErrors({ ...errors, quantidade: 'Quantidade é obrigatória' });
      return;
    }

    if (!localizacaoSelecionada || localizacaoSelecionada.trim() === '') {
      setErrors({ ...errors, localizacao: 'Localização é obrigatória' });
      return;
    }

    const movimentacaoData: MovimentacaoRequest = {
      tipo: 'entrada',
      quantidade: quantidade.trim(),
      item: itemId.trim(),
      localizacao: localizacaoSelecionada.trim(),
    };

    entradaMutation.mutate(movimentacaoData);
  };

  const modalContent = (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        data-test="modal-entrada-backdrop"
        zIndex={99999}
        contentClassName="max-w-lg max-h-[80vh] overflow-visible"
        role="dialog"
        contentDataTest="modal-entrada"
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            title="Fechar"
            data-test="modal-entrada-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="px-6 pb-6 space-y-6" data-test="modal-entrada-content">
          <div className="text-center pt-4 px-8">
            <div className="max-h-[100px] overflow-y-auto">
              <h2
                className="text-xl font-semibold text-foreground mb-1 wrap-break-word"
                data-test="modal-entrada-titulo"
              >
                Registrar entrada de {itemNome}
              </h2>
            </div>
          </div>

          {/* Campo Quantidade */}
          <div
            className="space-y-2"
            data-test="modal-entrada-quantidade-container"
          >
            <label
              htmlFor="quantidade"
              className="block text-base font-medium text-foreground"
            >
              Quantidade <span className="text-destructive">*</span>
            </label>
            <input
              id="quantidade"
              name="quantidade"
              type="text"
              placeholder="Digite a quantidade"
              value={quantidade}
              onChange={handleQuantidadeChange}
              maxLength={9}
              className={`w-full h-11 px-3 text-base md:text-sm bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.quantidade ? 'border-destructive' : 'border-border'
              }`}
              disabled={entradaMutation.isPending}
              data-test="modal-entrada-quantidade-input"
            />
            {errors.quantidade && (
              <p
                className="text-destructive text-sm mt-1"
                data-test="modal-entrada-quantidade-erro"
              >
                {errors.quantidade}
              </p>
            )}
          </div>

          {/* Campo Localização */}
          <div
            className="space-y-2"
            data-test="modal-entrada-localizacao-container"
          >
            <label className="block text-base font-medium text-foreground">
              Localização <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1" data-dropdown>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full h-11 flex items-center justify-between px-3 bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    errors.localizacao ? 'border-destructive' : 'border-border'
                  }`}
                  disabled={isLoadingLocalizacoes || entradaMutation.isPending}
                  data-test="modal-entrada-localizacao-dropdown"
                >
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                    <span
                      className={`truncate block ${localizacaoSelecionada ? 'max-w-[45px] sm:max-w-[120px]' : 'max-w-full'} ${localizacaoSelecionadaObj ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {isLoadingLocalizacoes
                        ? 'Carregando...'
                        : localizacaoSelecionadaObj?.nome ||
                          'Selecionar localização'}
                    </span>
                    {localizacaoSelecionada && (
                      <span
                        className={`text-sm px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                          getQuantidadeDisponivel(localizacaoSelecionada) > 0
                            ? 'bg-muted/50 text-foreground'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {getQuantidadeDisponivel(localizacaoSelecionada)}{' '}
                        disponível
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && !isLoadingLocalizacoes && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md z-50 max-h-60 overflow-hidden flex flex-col">
                    {/* Input de pesquisa */}
                    <div className="p-3 border-b border-border bg-muted/50">
                      <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={localizacaoPesquisa}
                        onChange={(e) => setLocalizacaoPesquisa(e.target.value)}
                        className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Lista de localizações */}
                    <div className="overflow-y-auto">
                      {localizacoesFiltradas.length > 0 ? (
                        <>
                          {localizacoesFiltradas.map((localizacao) => {
                            const qtdDisponivel = getQuantidadeDisponivel(
                              localizacao._id,
                            );
                            return (
                              <div
                                key={localizacao._id}
                                className={`flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors group ${
                                  localizacaoSelecionada === localizacao._id
                                    ? 'bg-[var(--ei-accent)]/5'
                                    : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLocalizacaoSelect(localizacao)
                                  }
                                  className={`flex-1 flex items-center gap-2 text-left cursor-pointer min-w-0 ${
                                    localizacaoSelecionada === localizacao._id
                                      ? 'text-[var(--ei-accent)] font-medium'
                                      : 'text-foreground'
                                  }`}
                                  title={localizacao.nome}
                                >
                                  <span className="truncate">
                                    {localizacao.nome}
                                  </span>
                                  <span
                                    className={`text-sm px-2 py-0.5 rounded-md shrink-0 ${
                                      qtdDisponivel > 0
                                        ? 'bg-muted/50 text-foreground'
                                        : 'bg-muted/50 text-muted-foreground'
                                    }`}
                                  >
                                    {qtdDisponivel} disponível
                                  </span>
                                </button>
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocalizacaoToEdit(localizacao);
                                      setIsEditarLocalizacaoModalOpen(true);
                                    }}
                                    className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                                    title="Editar localização"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocalizacaoToEdit(localizacao);
                                      setIsExcluirLocalizacaoModalOpen(true);
                                    }}
                                    className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                                    title="Excluir localização"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {/* Infinite scroll trigger */}
                          <div ref={observerTarget} className="h-1" />
                          {/* Loading indicator */}
                          {isFetchingNextPage && (
                            <div className="flex justify-center py-4">
                              <PulseLoader color="var(--ei-accent)" size={8} />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                          Nenhuma localização encontrada
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={() => setIsAddingLocalizacao(true)}
                className="text-ei-accent-foreground h-11! w-11! p-0! flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
                style={{ backgroundColor: 'var(--ei-accent)' }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.localizacao && (
              <p className="text-destructive text-sm mt-1">
                {errors.localizacao}
              </p>
            )}
          </div>

          {/* Mensagem de erro da API */}
          {entradaMutation.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
              <div className="font-medium mb-1">
                Não foi possível registrar a entrada
              </div>
              <div className="text-destructive/80">
                {(entradaMutation.error as any)?.response?.data?.message ||
                  (entradaMutation.error as any)?.errors.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div
          className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md"
          data-test="modal-entrada-footer"
        >
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={entradaMutation.isPending}
              className="h-11 flex-1 cursor-pointer"
              data-test="modal-entrada-cancelar"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={entradaMutation.isPending}
              className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--ei-accent)' }}
              data-test="modal-entrada-confirmar"
            >
              {entradaMutation.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </ModalShell>

      {/* Modal para adicionar localização */}
      {isAddingLocalizacao && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          style={{
            zIndex: 100000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddingLocalizacao(false);
              setNovaLocalizacao('');
              setNovaLocalizacaoDescricao('');
              setErrors((prev) => ({ ...prev, novaLocalizacao: undefined }));
            }
          }}
        >
          <div
            className="bg-card rounded-md border border-border shadow-none max-w-lg w-full animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de fechar */}
            <div className="relative p-6 pb-0">
              <button
                onClick={() => {
                  setIsAddingLocalizacao(false);
                  setNovaLocalizacao('');
                  setNovaLocalizacaoDescricao('');
                  setErrors((prev) => ({
                    ...prev,
                    novaLocalizacao: undefined,
                  }));
                }}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center pt-4">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Nova Localização
                </h2>
              </div>

              {/* Campo Nome da Localização */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="novaLocalizacao"
                    className="block text-base font-medium text-foreground"
                  >
                    Nome da Localização{' '}
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {novaLocalizacao.length}/100
                  </span>
                </div>
                <input
                  id="novaLocalizacao"
                  type="text"
                  placeholder="Digite o nome da localização"
                  value={novaLocalizacao}
                  onChange={(e) => {
                    setNovaLocalizacao(e.target.value);
                    if (errors.novaLocalizacao) {
                      setErrors((prev) => ({
                        ...prev,
                        novaLocalizacao: undefined,
                      }));
                    }
                  }}
                  maxLength={100}
                  className={`w-full h-11 px-3 text-base md:text-sm bg-background border rounded-md hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors ${
                    errors.novaLocalizacao
                      ? 'border-destructive'
                      : 'border-border'
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLocalizacao();
                    }
                  }}
                  autoFocus
                />
                {errors.novaLocalizacao && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.novaLocalizacao}
                  </p>
                )}
              </div>

              {/* Campo Descrição da Localização */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="novaLocalizacaoDescricao"
                    className="block text-base font-medium text-foreground"
                  >
                    Descrição
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {novaLocalizacaoDescricao.length}/200
                  </span>
                </div>
                <input
                  id="novaLocalizacaoDescricao"
                  type="text"
                  placeholder="Breve descrição da localização (opcional)"
                  value={novaLocalizacaoDescricao}
                  onChange={(e) =>
                    setNovaLocalizacaoDescricao(e.target.value)
                  }
                  maxLength={200}
                  className="w-full h-11 px-3 text-base md:text-sm bg-background border border-border rounded-md hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Footer com ações */}
            <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingLocalizacao(false);
                    setNovaLocalizacao('');
                    setNovaLocalizacaoDescricao('');
                    setErrors((prev) => ({
                      ...prev,
                      novaLocalizacao: undefined,
                    }));
                  }}
                  disabled={createLocalizacaoMutation.isPending}
                  className="h-11 flex-1 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddLocalizacao}
                  disabled={createLocalizacaoMutation.isPending}
                  className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: 'var(--ei-accent)' }}
                >
                  {createLocalizacaoMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {typeof window !== 'undefined' &&
        createPortal(modalContent, document.body)}
      {localizacaoToEdit && (
        <>
          <ModalEditarLocalizacao
            isOpen={isEditarLocalizacaoModalOpen}
            onClose={() => {
              setIsEditarLocalizacaoModalOpen(false);
              setLocalizacaoToEdit(null);
            }}
            localizacaoId={localizacaoToEdit._id}
            localizacaoNome={localizacaoToEdit.nome}
            localizacaoDescricao={localizacaoToEdit.descricao}
            onSuccess={onClose}
          />
          <ModalExcluirLocalizacao
            isOpen={isExcluirLocalizacaoModalOpen}
            onClose={() => {
              setIsExcluirLocalizacaoModalOpen(false);
              setLocalizacaoToEdit(null);
            }}
            localizacaoId={localizacaoToEdit._id}
            localizacaoNome={localizacaoToEdit.nome}
            onSuccess={onClose}
          />
        </>
      )}
    </>
  );
}
