'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalShell } from '@/components/ui/modal-shell';
import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import { ItemOrcamento } from '@/types/orcamentos';
import { FornecedorApiResponse } from '@/types/fornecedores';
import ModalSelecionarItem from '@/components/modal-selecionar-item';

interface ModalCadastrarOrcamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ModalCadastrarOrcamento({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarOrcamentoProps) {
  const queryClient = useQueryClient();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [errors, setErrors] = useState<{ nome?: string }>({});

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isFornecedorDropdownOpen, setIsFornecedorDropdownOpen] = useState<
    number | null
  >(null);
  const [fornecedorPesquisa, setFornecedorPesquisa] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const fornecedorButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fornecedorObserverTarget = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setItens([]);
    setErrors({});
    setIsItemModalOpen(false);
    setIsFornecedorDropdownOpen(null);
    setFornecedorPesquisa('');
    setDropdownPosition(null);
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

  const {
    data: fornecedoresData,
    isLoading: isLoadingFornecedores,
    error: fornecedoresError,
    fetchNextPage: fetchNextPageFornecedores,
    hasNextPage: hasNextPageFornecedores,
    isFetchingNextPage: isFetchingNextPageFornecedores,
  } = useInfiniteQuery({
    queryKey: ['fornecedores-dropdown', fornecedorPesquisa],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (fornecedorPesquisa) params.append('nome', fornecedorPesquisa);
      params.append('limite', '20');
      params.append('page', pageParam.toString());
      return await get<FornecedorApiResponse>(
        `/fornecedores?${params.toString()}`,
      );
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: isFornecedorDropdownOpen !== null,
  });

  useEffect(() => {
    if (fornecedoresError) {
      console.error('Erro ao buscar fornecedores:', fornecedoresError);
    }
  }, [fornecedoresError]);

  useEffect(() => {
    if (
      !fornecedorObserverTarget.current ||
      isFornecedorDropdownOpen === null
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageFornecedores &&
          !isFetchingNextPageFornecedores
        ) {
          fetchNextPageFornecedores();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(fornecedorObserverTarget.current);
    return () => observer.disconnect();
  }, [
    isFornecedorDropdownOpen,
    hasNextPageFornecedores,
    isFetchingNextPageFornecedores,
    fetchNextPageFornecedores,
  ]);

  const createOrcamentoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await post('/orcamentos', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        'Erro ao criar orçamento';
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setErrors({ nome: 'Nome é obrigatório' });
      return;
    }

    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      return;
    }

    const itensInvalidos = itens.filter((c) => !c.item || !c.fornecedor);
    if (itensInvalidos.length > 0) {
      toast.error('Preencha todos os campos do(s) item(ns).', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      return;
    }

    const orcamentoData = {
      nome,
      descricao: descricao || undefined,
      itens: itens.map((c) => ({
        item: c.item,
        fornecedor: c.fornecedor,
        quantidade: c.quantidade,
        valor_unitario: c.valor_unitario,
      })),
    };
    createOrcamentoMutation.mutate(orcamentoData);
  };

  const handleAdicionarItem = () => {
    setIsItemModalOpen(true);
  };

  const handleAdicionarItensMultiplos = (
    itensSelecionados: Array<{ id: string; nome: string }>,
  ) => {
    const novosItens = itensSelecionados.map((comp) => ({
      item: comp.id,
      nome: comp.nome,
      fornecedor: '',
      quantidade: 1,
      valor_unitario: 0,
      subtotal: 0,
    }));
    setItens([...itens, ...novosItens]);
  };

  const handleRemoverItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
  };

  const handleFornecedorSelect = (
    index: number,
    fornecedorId: string,
    fornecedorNome: string,
  ) => {
    const novosItens = [...itens];
    novosItens[index].fornecedor = fornecedorId;
    novosItens[index].fornecedor_nome = fornecedorNome;
    setItens(novosItens);
    setIsFornecedorDropdownOpen(null);
    setFornecedorPesquisa('');
    setDropdownPosition(null);
  };

  const handleOpenFornecedorDropdown = (index: number) => {
    const button = fornecedorButtonRefs.current[index];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
      setIsFornecedorDropdownOpen(index);
      setFornecedorPesquisa('');
    }
  };

  const handleQuantidadeChange = (index: number, delta: number) => {
    const novosItens = [...itens];
    const novaQuantidade = Math.max(1, novosItens[index].quantidade + delta);
    novosItens[index].quantidade = novaQuantidade;
    novosItens[index].subtotal =
      novaQuantidade * novosItens[index].valor_unitario;
    setItens(novosItens);
  };

  const handleValorUnitarioChange = (index: number, valor: string) => {
    const novosItens = [...itens];
    const valorNumerico = parseFloat(valor) || 0;
    novosItens[index].valor_unitario = valorNumerico;
    novosItens[index].subtotal = novosItens[index].quantidade * valorNumerico;
    setItens(novosItens);
  };

  const calcularTotal = () => {
    return itens.reduce((total, comp) => total + comp.subtotal, 0);
  };

  const fornecedoresLista = fornecedoresData?.pages
    ? fornecedoresData.pages.flatMap((page) => page.data.docs)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('[data-dropdown]') &&
        !target.closest('[data-dropdown-portal]')
      ) {
        setIsFornecedorDropdownOpen(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isFornecedorDropdownOpen !== null) {
        const button = fornecedorButtonRefs.current[isFornecedorDropdownOpen];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isFornecedorDropdownOpen]);

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      data-test="modal-cadastrar-orcamento"
      zIndex={99999}
      contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="relative p-6 pb-0">
        <button
          data-test="modal-cadastrar-orcamento-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={20} />
        </button>
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground">
            Adicionar orçamento
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4 sm:space-y-6">
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
              placeholder="Projeto - Horta Automatizada"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (errors.nome) {
                  setErrors((prev) => ({ ...prev, nome: undefined }));
                }
              }}
              maxLength={100}
              className={`w-full h-11 ${errors.nome ? 'border-destructive!' : ''}`}
              data-test="input-nome-orcamento"
            />
            {errors.nome && (
              <p className="text-destructive text-xs sm:text-sm mt-1">
                {errors.nome}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label
                htmlFor="descricao"
                className="text-sm font-semibold text-foreground tracking-tight"
              >
                Descrição
              </Label>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {descricao.length}/10000
              </span>
            </div>
            <textarea
              id="descricao"
              placeholder="Desenvolvimento de uma horta automatizada por arduino."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none min-h-[100px] bg-card"
              maxLength={10000}
              data-test="textarea-descricao-orcamento"
            />
          </div>

          {/* Itens do orçamento */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-semibold text-foreground tracking-tight">
                Itens do orçamento
              </Label>
              <Button
                type="button"
                onClick={handleAdicionarItem}
                className="h-9 flex items-center gap-2 text-white hover:bg-green-500 cursor-pointer bg-green-600 text-sm px-3"
                data-test="botao-adicionar-item"
              >
                <Plus className="w-4 h-4" />
                Adicionar item
              </Button>
            </div>

            {/* Tabela */}
            <div
              className="border rounded-t-md bg-card overflow-hidden"
              data-test="tabela-itens-orcamento"
            >
              {itens.length === 0 ? (
                <div className="py-8 flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                  Nenhum item adicionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full caption-bottom text-xs min-w-[720px]">
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead className="bg-muted shadow-sm">
                      <tr className="bg-muted border-b">
                        <th className="font-semibold text-foreground bg-muted text-center px-3 py-2">
                          NOME
                        </th>
                        <th className="font-semibold text-foreground bg-muted text-center px-3 py-2">
                          FORNECEDOR
                        </th>
                        <th className="font-semibold text-foreground bg-muted text-center px-3 py-2">
                          QUANTIDADE
                        </th>
                        <th className="font-semibold text-foreground bg-muted text-center px-3 py-2">
                          VALOR UNITÁRIO
                        </th>
                        <th className="font-semibold text-foreground bg-muted text-center px-3 py-2">
                          SUBTOTAL
                        </th>
                        <th className="font-semibold text-foreground bg-muted text-center px-3 py-2">
                          AÇÕES
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((comp, index) => (
                        <tr key={index} className="hover:bg-muted border-b">
                          <td className="px-3 py-2">
                            <span
                              className="text-xs font-semibold text-foreground truncate block"
                              title={comp.nome}
                            >
                              {comp.nome}
                            </span>
                          </td>

                          <td className="px-3 py-2">
                            <div className="relative" data-dropdown>
                              <button
                                ref={(el) => {
                                  fornecedorButtonRefs.current[index] = el;
                                }}
                                type="button"
                                onClick={() => {
                                  if (isFornecedorDropdownOpen === index) {
                                    setIsFornecedorDropdownOpen(null);
                                    setDropdownPosition(null);
                                    setFornecedorPesquisa('');
                                  } else {
                                    handleOpenFornecedorDropdown(index);
                                  }
                                }}
                                className="w-full h-9 flex items-center justify-between px-2 bg-card border border-border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[#0f1419]/50 text-xs cursor-pointer"
                                data-test="select-fornecedor"
                              >
                                <span
                                  className={`truncate ${comp.fornecedor_nome ? 'text-foreground' : 'text-muted-foreground'}`}
                                >
                                  {comp.fornecedor_nome || 'Selecione'}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                              </button>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantidadeChange(index, -1)
                                }
                                className="p-1 hover:bg-muted rounded cursor-pointer"
                                disabled={comp.quantidade <= 1}
                                data-test="botao-decrementar"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                value={comp.quantidade}
                                onChange={(e) => {
                                  const novosItens = [...itens];
                                  novosItens[index].quantidade = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1,
                                  );
                                  novosItens[index].subtotal =
                                    novosItens[index].quantidade *
                                    novosItens[index].valor_unitario;
                                  setItens(novosItens);
                                }}
                                className="w-12 px-1 py-1 text-center border border-border rounded-md"
                                min="1"
                                data-test="input-quantidade"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantidadeChange(index, 1)}
                                className="p-1 hover:bg-muted rounded cursor-pointer"
                                data-test="botao-incrementar"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={comp.valor_unitario}
                              onChange={(e) =>
                                handleValorUnitarioChange(index, e.target.value)
                              }
                              className="w-full h-9 text-center border border-border rounded-md"
                              placeholder="R$0,00"
                              step="0.01"
                              min="0"
                              data-test="input-valor-unitario"
                            />
                          </td>

                          <td
                            className="px-3 py-2 text-center text-foreground font-medium"
                            data-test="subtotal"
                          >
                            R${comp.subtotal.toFixed(2)}
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoverItem(index)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Remover item"
                                data-test="botao-remover-item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-x border-b rounded-b-md bg-muted px-4 py-2">
              <div
                className="text-center font-semibold text-foreground text-sm"
                data-test="total-orcamento"
              >
                Total: R${calcularTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-sm">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createOrcamentoMutation.isPending}
              className="h-11 flex-1 cursor-pointer"
              data-test="botao-cancelar"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createOrcamentoMutation.isPending}
              className="h-11 flex-1 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#0f1419' }}
              data-test="botao-salvar"
            >
              {createOrcamentoMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </form>

      {/* Modal de Seleção de Itens */}
      <ModalSelecionarItem
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSelectMultiple={handleAdicionarItensMultiplos}
        multiSelect={true}
      />

      {/* Dropdown de Fornecedor */}
      {isFornecedorDropdownOpen !== null &&
        dropdownPosition &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            data-dropdown-portal
            data-test="dropdown-fornecedores"
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 100000,
            }}
            className="mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={fornecedorPesquisa}
                onChange={(e) => setFornecedorPesquisa(e.target.value)}
                className="w-full h-9 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f1419]/50"
                onClick={(e) => e.stopPropagation()}
                data-test="dropdown-search-input"
              />
            </div>
            <div className="overflow-y-auto" data-test="fornecedores-list">
              {isLoadingFornecedores ? (
                <div className="flex justify-center py-4">
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 rounded-full border-2 border-[#0f1419]/15"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#0f1419] border-r-transparent animate-spin"></div>
                  </div>
                </div>
              ) : fornecedoresError ? (
                <div className="px-4 py-6 text-center text-red-600 text-sm">
                  Erro ao buscar fornecedores:{' '}
                  {(fornecedoresError as any)?.message || 'erro desconhecido'}
                </div>
              ) : fornecedoresLista.length > 0 ? (
                <>
                  {fornecedoresLista.map((fornecedor, idx) => (
                    <button
                      key={fornecedor._id}
                      type="button"
                      onClick={() =>
                        handleFornecedorSelect(
                          isFornecedorDropdownOpen,
                          fornecedor._id,
                          fornecedor.nome,
                        )
                      }
                      className="w-full px-4 py-2 text-left text-foreground hover:bg-muted text-sm cursor-pointer"
                      data-test={`fornecedor-option-${idx}`}
                    >
                      {fornecedor.nome}
                    </button>
                  ))}
                  <div ref={fornecedorObserverTarget} className="h-1" />
                  {isFetchingNextPageFornecedores && (
                    <div className="flex justify-center py-2">
                      <div className="relative w-4 h-4">
                        <div className="absolute inset-0 rounded-full border-2 border-[#0f1419]/15"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-[#0f1419] border-r-transparent animate-spin"></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                  Nenhum fornecedor encontrado
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
