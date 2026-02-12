import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import ModalEditarLocalizacao from './modal-editar-localizacao';
import ModalExcluirLocalizacao from './modal-excluir-localizacao';
import { PulseLoader } from 'react-spinners';

interface Localizacao {
  _id: string;
  nome: string;
  ativo: boolean;
  usuario: string;
  __v: number;
}

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
  componente: string;
  localizacao: string;
}

interface EstoqueApiResponse {
  data: {
    docs: any[];
  };
}

interface ModalEntradaComponenteProps {
  isOpen: boolean;
  onClose: () => void;
  componenteId: string;
  componenteNome: string;
  onSuccess?: () => void;
}

export default function ModalEntradaComponente({
  isOpen,
  onClose,
  componenteId,
  componenteNome,
  onSuccess
}: ModalEntradaComponenteProps) {
  const queryClient = useQueryClient();
  const [quantidade, setQuantidade] = useState('');
  const [localizacaoSelecionada, setLocalizacaoSelecionada] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localizacaoPesquisa, setLocalizacaoPesquisa] = useState('');
  const [errors, setErrors] = useState<{ quantidade?: string; localizacao?: string; novaLocalizacao?: string }>({});
  const [isAddingLocalizacao, setIsAddingLocalizacao] = useState(false);
  const [novaLocalizacao, setNovaLocalizacao] = useState('');
  const [isEditarLocalizacaoModalOpen, setIsEditarLocalizacaoModalOpen] = useState(false);
  const [isExcluirLocalizacaoModalOpen, setIsExcluirLocalizacaoModalOpen] = useState(false);
  const [localizacaoToEdit, setLocalizacaoToEdit] = useState<Localizacao | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data: localizacoesData,
    isLoading: isLoadingLocalizacoes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['localizacoes-infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return await get<LocalizacoesApiResponse>(`/localizacoes?limit=20&page=${pageParam}`);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: isOpen,
  });

  const { data: estoquesData } = useQuery<EstoqueApiResponse>({
    queryKey: ['estoques', componenteId],
    queryFn: async () => {
      return await get<EstoqueApiResponse>(`/estoques/componente/${componenteId}`);
    },
    enabled: isOpen && !!componenteId,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const createLocalizacaoMutation = useMutation({
    mutationFn: async (nomeLocalizacao: string) => {
      return await post('/localizacoes', { nome: nomeLocalizacao });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['localizacoes'] });
      queryClient.invalidateQueries({ queryKey: ['localizacoes-infinite'] });
      setLocalizacaoSelecionada(data.data._id);
      setNovaLocalizacao('');
      setIsAddingLocalizacao(false);
      setErrors(prev => ({ ...prev, novaLocalizacao: undefined }));
      toast.success('Localização criada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message;
      setErrors(prev => ({ ...prev, novaLocalizacao: errorMessage }));
    }
  });

  const entradaMutation = useMutation({
    mutationFn: async (data: MovimentacaoRequest) => {
      return await post('/movimentacoes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['componentes']
      });

      queryClient.removeQueries({
        queryKey: ['estoques', componenteId]
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

        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const messages = errorData.errors.map((err: any) => err.message).filter(Boolean);
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
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error('Não foi possível registrar a entrada.', {
          position: 'top-right',
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
    }
  }, [isOpen]);

  useEffect(() => {
    if (!observerTarget.current || !isDropdownOpen) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [isDropdownOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isOpen) return null;

  const localizacoes = localizacoesData?.pages ? localizacoesData.pages.flatMap(page => page.data.docs) : [];
  const estoques = estoquesData?.data?.docs || [];
  const localizacoesFiltradas = localizacoes.filter((loc: Localizacao) =>
    loc.nome.toLowerCase().includes(localizacaoPesquisa.toLowerCase())
  );
  const localizacaoSelecionadaObj = localizacoes.find(loc => loc._id === localizacaoSelecionada);

  const getQuantidadeDisponivel = (localizacaoId: string): number => {
    const estoque = estoques.find((e: any) => e.localizacao._id === localizacaoId);
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
        setErrors(prev => ({ ...prev, quantidade: undefined }));
      }
    }
  };

  const handleLocalizacaoSelect = (localizacao: Localizacao) => {
    setLocalizacaoSelecionada(localizacao._id);
    setIsDropdownOpen(false);
    setLocalizacaoPesquisa('');
    if (errors.localizacao) {
      setErrors(prev => ({ ...prev, localizacao: undefined }));
    }
  };

  const handleAddLocalizacao = () => {
    if (!novaLocalizacao.trim()) {
      setErrors(prev => ({ ...prev, novaLocalizacao: 'Nome da localização é obrigatório' }));
      return;
    }
    createLocalizacaoMutation.mutate(novaLocalizacao.trim());
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

    if (!componenteId) {
      setErrors({ ...errors, quantidade: 'ID do componente não encontrado' });
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
      componente: componenteId.trim(),
      localizacao: localizacaoSelecionada.trim(),
    };

    entradaMutation.mutate(movimentacaoData);
  };

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleBackdropClick}
      data-test="modal-entrada-backdrop"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        data-test="modal-entrada"
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-1 break-words" data-test="modal-entrada-titulo">
                Registrar entrada de {componenteNome}
              </h2>
            </div>
          </div>

          {/* Campo Quantidade */}
          <div className="space-y-2" data-test="modal-entrada-quantidade-container">
            <div className="flex justify-between items-center">
              <label htmlFor="quantidade" className="block text-base font-medium text-gray-700">
                Quantidade <span className="text-red-500">*</span>
              </label>
              <span className="text-sm text-gray-500">
                {quantidade.length}/9
              </span>
            </div>
            <input
              id="quantidade"
              name="quantidade"
              type="text"
              placeholder="Digite a quantidade"
              value={quantidade}
              onChange={handleQuantidadeChange}
              maxLength={9}
              className={`w-full px-4 py-3 bg-white border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${errors.quantidade ? 'border-red-500' : 'border-gray-300'
                }`}
              disabled={entradaMutation.isPending}
              data-test="modal-entrada-quantidade-input"
            />
            {errors.quantidade && (
              <p className="text-red-500 text-sm mt-1" data-test="modal-entrada-quantidade-erro">{errors.quantidade}</p>
            )}
          </div>

          {/* Campo Localização */}
          <div className="space-y-2" data-test="modal-entrada-localizacao-container">
            <label className="block text-base font-medium text-gray-700">
              Localização <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1" data-dropdown>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${errors.localizacao ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={isLoadingLocalizacoes || entradaMutation.isPending}
                  data-test="modal-entrada-localizacao-dropdown"
                >
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                    <span className={`truncate block ${localizacaoSelecionada ? 'max-w-[45px] sm:max-w-[120px]' : 'max-w-full'} ${localizacaoSelecionadaObj ? 'text-gray-900' : 'text-gray-500'}`}>
                      {isLoadingLocalizacoes
                        ? 'Carregando...'
                        : localizacaoSelecionadaObj?.nome || 'Selecionar localização'
                      }
                    </span>
                    {localizacaoSelecionada && (
                      <span className={`text-sm px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap ${getQuantidadeDisponivel(localizacaoSelecionada) > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                        }`}>
                        {getQuantidadeDisponivel(localizacaoSelecionada)} disponível
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''
                    }`} />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && !isLoadingLocalizacoes && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                    {/* Input de pesquisa */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={localizacaoPesquisa}
                        onChange={(e) => setLocalizacaoPesquisa(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Lista de localizações */}
                    <div className="overflow-y-auto">
                      {localizacoesFiltradas.length > 0 ? (
                        <>
                        {localizacoesFiltradas.map((localizacao) => {
                          const qtdDisponivel = getQuantidadeDisponivel(localizacao._id);
                          return (
                            <div
                              key={localizacao._id}
                              className={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors group ${localizacaoSelecionada === localizacao._id ? 'bg-blue-50' : ''
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleLocalizacaoSelect(localizacao)}
                                className={`flex-1 flex items-center gap-2 text-left cursor-pointer min-w-0 ${localizacaoSelecionada === localizacao._id ? 'text-blue-600 font-medium' : 'text-gray-900'
                                  }`}
                                title={localizacao.nome}
                              >
                                <span className="truncate">{localizacao.nome}</span>
                                <span className={`text-sm px-2 py-0.5 rounded flex-shrink-0 ${qtdDisponivel > 0
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                                  }`}>
                                  {qtdDisponivel} disponível
                                </span>
                              </button>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setLocalizacaoToEdit(localizacao)
                                    setIsEditarLocalizacaoModalOpen(true)
                                  }}
                                  className="p-1.5 text-gray-900 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                  title="Editar localização"
                                >
                                  <Edit size={20} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setLocalizacaoToEdit(localizacao)
                                    setIsExcluirLocalizacaoModalOpen(true)
                                  }}
                                  className="p-1.5 text-gray-900 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                  title="Excluir localização"
                                >
                                  <Trash2 size={20} />
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
                              <PulseLoader color="#306FCC" size={8} />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
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
                className="text-white !h-[50px] !w-[50px] !p-0 flex items-center justify-center cursor-pointer hover:opacity-90 flex-shrink-0"
                style={{ backgroundColor: '#306FCC' }}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            {errors.localizacao && (
              <p className="text-red-500 text-sm mt-1">{errors.localizacao}</p>
            )}
          </div>

          {/* Mensagem de erro da API */}
          {entradaMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <div className="font-medium mb-1">Não foi possível registrar a entrada</div>
              <div className="text-red-500">
                {(entradaMutation.error as any)?.response?.data?.message ||
                  (entradaMutation.error as any)?.errors.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg" data-test="modal-entrada-footer">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={entradaMutation.isPending}
              className="flex-1 cursor-pointer"
              data-test="modal-entrada-cancelar"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={entradaMutation.isPending}
              className="flex-1 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
              data-test="modal-entrada-confirmar"
            >
              {entradaMutation.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para adicionar localização */}
      {isAddingLocalizacao && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{
            zIndex: 100000,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddingLocalizacao(false);
              setNovaLocalizacao('');
              setErrors(prev => ({ ...prev, novaLocalizacao: undefined }));
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de fechar */}
            <div className="relative p-6 pb-0">
              <button
                onClick={() => {
                  setIsAddingLocalizacao(false);
                  setNovaLocalizacao('');
                  setErrors(prev => ({ ...prev, novaLocalizacao: undefined }));
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center pt-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Nova Localização
                </h2>
              </div>

              {/* Campo Nome da Localização */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="novaLocalizacao" className="block text-base font-medium text-gray-700">
                    Nome da Localização <span className="text-red-500">*</span>
                  </label>
                  <span className="text-sm text-gray-500">
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
                      setErrors(prev => ({ ...prev, novaLocalizacao: undefined }));
                    }
                  }}
                  maxLength={100}
                  className={`w-full px-4 py-3 bg-white border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.novaLocalizacao ? 'border-red-500' : 'border-gray-300'
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
                  <p className="text-red-500 text-sm mt-1">{errors.novaLocalizacao}</p>
                )}
              </div>
            </div>

            {/* Footer com ações */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingLocalizacao(false);
                    setNovaLocalizacao('');
                    setErrors(prev => ({ ...prev, novaLocalizacao: undefined }));
                  }}
                  disabled={createLocalizacaoMutation.isPending}
                  className="flex-1 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddLocalizacao}
                  disabled={createLocalizacaoMutation.isPending}
                  className="flex-1 text-white hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: '#306FCC' }}
                >
                  {createLocalizacaoMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
      {localizacaoToEdit && (
        <>
          <ModalEditarLocalizacao
            isOpen={isEditarLocalizacaoModalOpen}
            onClose={() => {
              setIsEditarLocalizacaoModalOpen(false)
              setLocalizacaoToEdit(null)
            }}
            localizacaoId={localizacaoToEdit._id}
            localizacaoNome={localizacaoToEdit.nome}
            onSuccess={onClose}
          />
          <ModalExcluirLocalizacao
            isOpen={isExcluirLocalizacaoModalOpen}
            onClose={() => {
              setIsExcluirLocalizacaoModalOpen(false)
              setLocalizacaoToEdit(null)
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
