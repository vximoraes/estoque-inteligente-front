"use client"
import ItemEstoque from "@/components/item-estoque";
import StatCard from "@/components/stat-card";
import Cabecalho from "@/components/cabecalho";
import ModalLocalizacoes from "@/components/modal-localizacoes";
import ModalFiltros from "@/components/modal-filtros";
import ModalEntradaItem from "@/components/modal-entrada-item";
import ModalSaidaItem from "@/components/modal-saida-item";
import ModalExcluirItem from "@/components/modal-excluir-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { ApiResponse, EstoqueApiResponse } from '@/types/itens';
import { Search, Filter, Plus, Package, CheckCircle, AlertTriangle, XCircle, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useQueryState } from 'nuqs';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CategoriasApiResponse {
  data: {
    docs: any[];
  };
}

function ItensPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [entradaItemId, setEntradaItemId] = useState<string | null>(null);
  const [isSaidaModalOpen, setIsSaidaModalOpen] = useState(false);
  const [saidaItemId, setSaidaItemId] = useState<string | null>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirItemId, setExcluirItemId] = useState<string | null>(null);
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [categoriaFilter, setCategoriaFilter] = useQueryState('categoria', { defaultValue: '' });
  const [statusFilter, setStatusFilter] = useQueryState('status', { defaultValue: '' });

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 2560) {
        setItemsPerPage(24);
      } else if (width >= 1920) {
        setItemsPerPage(18);
      } else if (width >= 1024) {
        setItemsPerPage(12);
      } else if (width >= 768) {
        setItemsPerPage(9);
      } else {
        setItemsPerPage(6);
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const { data, isLoading, isFetching, error, refetch } = useQuery<ApiResponse>({
    queryKey: ['itens', searchTerm, categoriaFilter, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      if (categoriaFilter) params.append('categoria', categoriaFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', itemsPerPage.toString());
      params.append('page', currentPage.toString());

      const queryString = params.toString();
      const url = `/itens${queryString ? `?${queryString}` : ''}`;

      return await get<ApiResponse>(url);
    },
    refetchOnMount: 'always',
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Query para buscar estoques de um item específico
  const { data: estoquesData, isLoading: isLoadingEstoques } = useQuery<EstoqueApiResponse>({
    queryKey: ['estoques', selectedItemId],
    queryFn: async () => {
      return await get<EstoqueApiResponse>(
        `/estoques/item/${selectedItemId}`
      );
    },
    enabled: !!selectedItemId,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Query para buscar categorias para mostrar o nome nos filtros
  const { data: categoriasData } = useQuery<CategoriasApiResponse>({
    queryKey: ['categorias'],
    queryFn: async () => {
      return await get<CategoriasApiResponse>('/categorias?limit=9999');
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const itemId = searchParams.get('id');
    const imagem = searchParams.get('imagem')

    if (success === 'created') {
      toast.success('Item criado com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
      router.replace('/itens');
    } else if (success === 'updated') {
      if (itemId) {
        setUpdatingItemId(itemId);

      }
      toast.success('Item atualizado com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
      refetch();
      router.replace('/itens');
    }
  }, [searchParams, router, refetch]);

  const handleEdit = (id: string) => {
    router.push(`/itens/editar/${id}`);
  };

  const handleDelete = (id: string) => {
    setExcluirItemId(id);
    setIsExcluirModalOpen(true);
  };

  const handleItemClick = (id: string) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItemId(null);
  };

  const handleOpenFiltrosModal = () => {
    setIsFiltrosModalOpen(true);
  };

  const handleCloseFiltrosModal = () => {
    setIsFiltrosModalOpen(false);
  };

  const handleFiltersChange = (categoria: string, status: string) => {
    setCategoriaFilter(categoria);
    setStatusFilter(status);
  };

  const handleEntrada = (id: string) => {
    setEntradaItemId(id);
    setIsEntradaModalOpen(true);
  };

  const handleSaida = (id: string) => {
    setSaidaItemId(id);
    setIsSaidaModalOpen(true);
  };

  const handleCloseEntradaModal = () => {
    setIsEntradaModalOpen(false);
    setEntradaItemId(null);
  };

  const handleEntradaSuccess = () => {
    if (entradaItemId) {
      setUpdatingItemId(entradaItemId);
    }
    toast.success('Entrada registrada com sucesso!', {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      transition: Slide,
    });
    refetch();
  };

  const handleCloseSaidaModal = () => {
    setIsSaidaModalOpen(false);
    setSaidaItemId(null);
  };

  const handleSaidaSuccess = () => {
    if (saidaItemId) {
      setUpdatingItemId(saidaItemId);
    }
    toast.success('Saída registrada com sucesso!', {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      transition: Slide,
    });
    refetch();
  };

  const handleCloseExcluirModal = () => {
    setIsExcluirModalOpen(false);
    setExcluirItemId(null);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    const isLastItemOnPage = itens.length === 1;
    const shouldGoToPreviousPage = isLastItemOnPage && currentPage > 1;

    toast.success('Item excluído com sucesso!', {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      transition: Slide,
    });

    if (shouldGoToPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }

    router.refresh();
    await refetch();
    setIsRefetchingAfterDelete(false);
  };

  const handleAdicionarClick = () => {
    router.push('/itens/adicionar');
  };

  useEffect(() => {
    if (!isFetching && updatingItemId) {
      setUpdatingItemId(null);
    }
  }, [isFetching, updatingItemId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoriaFilter, statusFilter, itemsPerPage]);

  const itens = data?.data?.docs || [];
  const paginationInfo = data?.data || {
    totalDocs: 0,
    limit: 0,
    totalPages: 0,
    page: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null
  };

  // Calcular estatísticas
  const totalItens = itens.length;
  const emEstoque = itens.filter(c => c.status === 'Em Estoque').length;
  const baixoEstoque = itens.filter(c => c.status === 'Baixo Estoque').length;
  const indisponiveis = itens.filter(c => c.status === 'Indisponível').length;
  // console.log(totalItens)
  return (
    <div className="w-full h-screen flex flex-col overflow-x-hidden" data-test="itens-page">
      <Cabecalho pagina="Itens" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 pb-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
          {/* Stats Cards - Colapsável no mobile */}
          <div className="mb-6">
            {/* Botão para mobile */}
            <button
              onClick={() => setIsStatsOpen(!isStatsOpen)}
              className="xl:hidden w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors h-10 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-700">Estatísticas</span>
              </div>
              {isStatsOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Cards - Sempre visível no desktop, colapsável no mobile */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[120px] ${isStatsOpen ? 'block mt-4' : 'hidden'} xl:grid xl:mt-0`} data-test="stats-grid">
            <StatCard
              title="Total de"
              subtitle="itens"
              value={totalItens}
              icon={Package}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              data-test="stat-total-itens"
              hoverTitle={`Total de itens cadastrados: ${totalItens}`}
            />

            <StatCard
              title="Em estoque"
              value={emEstoque}
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              data-test="stat-em-estoque"
              hoverTitle={`Itens disponíveis em estoque: ${emEstoque}`}
            />

            <StatCard
              title="Baixo estoque"
              value={baixoEstoque}
              icon={AlertTriangle}
              iconColor="text-yellow-600"
              iconBgColor="bg-yellow-100"
              data-test="stat-baixo-estoque"
              hoverTitle={`Itens com baixo estoque: ${baixoEstoque}`}
            />

            <StatCard
              title="Indisponível"
              value={indisponiveis}
              icon={XCircle}
              iconColor="text-red-600"
              iconBgColor="bg-red-100"
              data-test="stat-indisponiveis"
              hoverTitle={`Itens indisponíveis: ${indisponiveis}`}
            />
          </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6" data-test="search-actions-bar">
            <div className="relative flex-1" data-test="search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Pesquisar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-test="search-input"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 cursor-pointer"
              data-test="filtros-button"
              onClick={handleOpenFiltrosModal}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button
              className="flex items-center gap-2 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
              data-test="adicionar-button"
              onClick={handleAdicionarClick}
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>

          {/* Filtros aplicados */}
          {(categoriaFilter || statusFilter) && (
            <div className="mb-4" data-test="applied-filters">
              <div className="flex flex-wrap items-center gap-2">
                {categoriaFilter && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm" data-test="applied-filter-categoria">
                    <span className="font-medium">Categoria:</span>
                    <span data-test="applied-filter-categoria-nome">{categoriasData?.data?.docs?.find((cat: any) => cat._id === categoriaFilter)?.nome || 'Carregando...'}</span>
                    <button
                      onClick={() => setCategoriaFilter('')}
                      className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                      title="Remover filtro de categoria"
                      data-test="applied-filter-categoria-remover"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {statusFilter && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm" data-test="applied-filter-status">
                    <span className="font-medium">Status:</span>
                    <span data-test="applied-filter-status-nome">{statusFilter}</span>
                    <button
                      onClick={() => setStatusFilter('')}
                      className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                      title="Remover filtro de status"
                      data-test="applied-filter-status-remover"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div
              className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
              data-test="error-message"
              title={`Erro completo: ${error.message}`}
            >
              Erro ao carregar itens: {error.message}
            </div>
          )}

          {isLoading || isRefetchingAfterDelete ? (
            <div className="flex flex-col items-center justify-center py-12" data-test="loading-spinner">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Carregando itens...</p>
            </div>
          ) : itens.length > 0 ? (
            <div
              className="grid gap-4 w-full"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(max(300px, min(400px, calc((100% - 3rem) / 6))), 1fr))' }}
              data-test="itens-grid"
            >
              {itens.map((item, index) => (
                <ItemEstoque
                  key={item._id}
                  id={item._id}
                  nome={item.nome}
                  categoria={item.categoria.nome}
                  quantidade={item.quantidade}
                  estoqueMinimo={item.estoque_minimo}
                  status={item.status}
                  imagem={item.imagem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClick={handleItemClick}
                  onEntrada={handleEntrada}
                  onSaida={handleSaida}
                  isLoading={updatingItemId === item._id && isFetching}
                  data-test={`item-card-${index}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8" data-test="empty-state">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum item encontrado para sua pesquisa.' : 'Não há itens cadastrados...'}
              </p>
            </div>
          )}
        </div>

        {/* Controles de Paginação */}
        {itens.length > 0 && paginationInfo.totalPages > 1 && (
          <div className="bg-white py-4 px-6 flex justify-center items-center shrink-0" data-test="pagination-controls">
            <div className="flex items-center gap-1">
              {/* Botão Anterior */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!paginationInfo.hasPrevPage || isFetching}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                data-test="prev-page-button"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {/* Números das páginas */}
              {(() => {
                const totalPages = paginationInfo.totalPages;
                const current = paginationInfo.page;
                const pages = [];

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  pages.push(1);

                  if (current > 3) {
                    pages.push('...');
                  }

                  const start = Math.max(2, current - 1);
                  const end = Math.min(totalPages - 1, current + 1);

                  for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) {
                      pages.push(i);
                    }
                  }

                  if (current < totalPages - 2) {
                    pages.push('...');
                  }

                  if (!pages.includes(totalPages)) {
                    pages.push(totalPages);
                  }
                }

                return pages.map((page, index) => {
                  if (page === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-2 text-gray-500"
                      >
                        ...
                      </span>
                    );
                  }

                  const pageNum = page as number;
                  const isActive = pageNum === current;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isFetching}
                      className={`min-w-[40px] px-3 py-2 rounded-md transition-colors cursor-pointer ${isActive
                        ? 'bg-blue-600 text-white font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                        } ${isFetching ? 'opacity-60 cursor-wait' : ''}`}
                      data-test={`page-${pageNum}-button`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}

              {/* Botão Próxima */}
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!paginationInfo.hasNextPage || isFetching}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                data-test="next-page-button"
                aria-label="Próxima página"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Localizações */}
      {selectedItemId && (
        <ModalLocalizacoes
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          itemId={selectedItemId}
          itemNome={itens.find(c => c._id === selectedItemId)?.nome || ''}
          itemDescricao={itens.find(c => c._id === selectedItemId)?.descricao}
          estoques={estoquesData?.data?.docs || []}
          isLoading={isLoadingEstoques}
          totalQuantidade={
            estoquesData?.data?.docs?.filter(estoque =>
              estoque.quantidade != null &&
              !isNaN(Number(estoque.quantidade)) &&
              Number(estoque.quantidade) > 0
            ).reduce((total, estoque) => total + Number(estoque.quantidade), 0) || 0
          }
        />
      )}

      {/* Modal de Filtros */}
      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={handleCloseFiltrosModal}
        categoriaFilter={categoriaFilter}
        statusFilter={statusFilter}
        onFiltersChange={handleFiltersChange}
      />

      {/* Modal de Entrada de Item */}
      {entradaItemId && (
        <ModalEntradaItem
          isOpen={isEntradaModalOpen}
          onClose={handleCloseEntradaModal}
          itemId={entradaItemId}
          itemNome={itens.find(c => c._id === entradaItemId)?.nome || ''}
          onSuccess={handleEntradaSuccess}
        />
      )}

      {/* Modal de Saída de Item */}
      {saidaItemId && (
        <ModalSaidaItem
          isOpen={isSaidaModalOpen}
          onClose={handleCloseSaidaModal}
          itemId={saidaItemId}
          itemNome={itens.find(c => c._id === saidaItemId)?.nome || ''}
          onSuccess={handleSaidaSuccess}
        />
      )}

      {/* Modal de Excluir Item */}
      {excluirItemId && (
        <ModalExcluirItem
          isOpen={isExcluirModalOpen}
          onClose={handleCloseExcluirModal}
          itemId={excluirItemId}
          itemNome={itens.find(c => c._id === excluirItemId)?.nome || ''}
          onSuccess={handleExcluirSuccess}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />
    </div>
  );
}

export default function ItensPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Carregando...</p>
      </div>
    }>
      <ItensPageContent />
    </Suspense>
  );
}
