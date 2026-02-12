"use client"
import ComponenteEletronico from "@/components/componente-eletronico";
import StatCard from "@/components/stat-card";
import Cabecalho from "@/components/cabecalho";
import ModalLocalizacoes from "@/components/modal-localizacoes";
import ModalFiltros from "@/components/modal-filtros";
import ModalEntradaComponente from "@/components/modal-entrada-componente";
import ModalSaidaComponente from "@/components/modal-saida-componente";
import ModalExcluirComponente from "@/components/modal-excluir-componente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { ApiResponse, EstoqueApiResponse } from '@/types/componentes';
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

function ComponentesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponenteId, setSelectedComponenteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [entradaComponenteId, setEntradaComponenteId] = useState<string | null>(null);
  const [isSaidaModalOpen, setIsSaidaModalOpen] = useState(false);
  const [saidaComponenteId, setSaidaComponenteId] = useState<string | null>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirComponenteId, setExcluirComponenteId] = useState<string | null>(null);
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] = useState(false);
  const [updatingComponenteId, setUpdatingComponenteId] = useState<string | null>(null);
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
    queryKey: ['componentes', searchTerm, categoriaFilter, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      if (categoriaFilter) params.append('categoria', categoriaFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', itemsPerPage.toString());
      params.append('page', currentPage.toString());

      const queryString = params.toString();
      const url = `/componentes${queryString ? `?${queryString}` : ''}`;

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

  // Query para buscar estoques de um componente específico
  const { data: estoquesData, isLoading: isLoadingEstoques } = useQuery<EstoqueApiResponse>({
    queryKey: ['estoques', selectedComponenteId],
    queryFn: async () => {
      return await get<EstoqueApiResponse>(
        `/estoques/componente/${selectedComponenteId}`
      );
    },
    enabled: !!selectedComponenteId,
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
    const componenteId = searchParams.get('id');
    const imagem = searchParams.get('imagem')

    if (success === 'created') {
      toast.success('Componente criado com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
      router.replace('/componentes');
    } else if (success === 'updated') {
      if (componenteId) {
        setUpdatingComponenteId(componenteId);

      }
      toast.success('Componente atualizado com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
      refetch();
      router.replace('/componentes');
    }
  }, [searchParams, router, refetch]);

  const handleEdit = (id: string) => {
    router.push(`/componentes/editar/${id}`);
  };

  const handleDelete = (id: string) => {
    setExcluirComponenteId(id);
    setIsExcluirModalOpen(true);
  };

  const handleComponenteClick = (id: string) => {
    setSelectedComponenteId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedComponenteId(null);
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
    setEntradaComponenteId(id);
    setIsEntradaModalOpen(true);
  };

  const handleSaida = (id: string) => {
    setSaidaComponenteId(id);
    setIsSaidaModalOpen(true);
  };

  const handleCloseEntradaModal = () => {
    setIsEntradaModalOpen(false);
    setEntradaComponenteId(null);
  };

  const handleEntradaSuccess = () => {
    if (entradaComponenteId) {
      setUpdatingComponenteId(entradaComponenteId);
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
    setSaidaComponenteId(null);
  };

  const handleSaidaSuccess = () => {
    if (saidaComponenteId) {
      setUpdatingComponenteId(saidaComponenteId);
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
    setExcluirComponenteId(null);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    const isLastComponentOnPage = componentes.length === 1;
    const shouldGoToPreviousPage = isLastComponentOnPage && currentPage > 1;

    toast.success('Componente excluído com sucesso!', {
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
    router.push('/componentes/adicionar');
  };

  useEffect(() => {
    if (!isFetching && updatingComponenteId) {
      setUpdatingComponenteId(null);
    }
  }, [isFetching, updatingComponenteId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoriaFilter, statusFilter, itemsPerPage]);

  const componentes = data?.data?.docs || [];
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
  const totalComponentes = componentes.length;
  const emEstoque = componentes.filter(c => c.status === 'Em Estoque').length;
  const baixoEstoque = componentes.filter(c => c.status === 'Baixo Estoque').length;
  const indisponiveis = componentes.filter(c => c.status === 'Indisponível').length;
  // console.log(totalComponentes)
  return (
    <div className="w-full h-screen flex flex-col overflow-x-hidden" data-test="componentes-page">
      <Cabecalho pagina="Componentes" />

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
              subtitle="componentes"
              value={totalComponentes}
              icon={Package}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              data-test="stat-total-componentes"
              hoverTitle={`Total de componentes cadastrados: ${totalComponentes}`}
            />

            <StatCard
              title="Em estoque"
              value={emEstoque}
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              data-test="stat-em-estoque"
              hoverTitle={`Componentes disponíveis em estoque: ${emEstoque}`}
            />

            <StatCard
              title="Baixo estoque"
              value={baixoEstoque}
              icon={AlertTriangle}
              iconColor="text-yellow-600"
              iconBgColor="bg-yellow-100"
              data-test="stat-baixo-estoque"
              hoverTitle={`Componentes com baixo estoque: ${baixoEstoque}`}
            />

            <StatCard
              title="Indisponível"
              value={indisponiveis}
              icon={XCircle}
              iconColor="text-red-600"
              iconBgColor="bg-red-100"
              data-test="stat-indisponiveis"
              hoverTitle={`Componentes indisponíveis: ${indisponiveis}`}
            />
          </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6" data-test="search-actions-bar">
            <div className="relative flex-1" data-test="search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Pesquisar componentes..."
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
              Erro ao carregar componentes: {error.message}
            </div>
          )}

          {isLoading || isRefetchingAfterDelete ? (
            <div className="flex flex-col items-center justify-center py-12" data-test="loading-spinner">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Carregando componentes...</p>
            </div>
          ) : componentes.length > 0 ? (
            <div
              className="grid gap-4 w-full"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(max(300px, min(400px, calc((100% - 3rem) / 6))), 1fr))' }}
              data-test="componentes-grid"
            >
              {componentes.map((componente, index) => (
                <ComponenteEletronico
                  key={componente._id}
                  id={componente._id}
                  nome={componente.nome}
                  categoria={componente.categoria.nome}
                  quantidade={componente.quantidade}
                  estoqueMinimo={componente.estoque_minimo}
                  status={componente.status}
                  imagem={componente.imagem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClick={handleComponenteClick}
                  onEntrada={handleEntrada}
                  onSaida={handleSaida}
                  isLoading={updatingComponenteId === componente._id && isFetching}
                  data-test={`componente-card-${index}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8" data-test="empty-state">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum componente encontrado para sua pesquisa.' : 'Não há componentes cadastrados...'}
              </p>
            </div>
          )}
        </div>

        {/* Controles de Paginação */}
        {componentes.length > 0 && paginationInfo.totalPages > 1 && (
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
      {selectedComponenteId && (
        <ModalLocalizacoes
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          componenteId={selectedComponenteId}
          componenteNome={componentes.find(c => c._id === selectedComponenteId)?.nome || ''}
          componenteDescricao={componentes.find(c => c._id === selectedComponenteId)?.descricao}
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

      {/* Modal de Entrada de Componente */}
      {entradaComponenteId && (
        <ModalEntradaComponente
          isOpen={isEntradaModalOpen}
          onClose={handleCloseEntradaModal}
          componenteId={entradaComponenteId}
          componenteNome={componentes.find(c => c._id === entradaComponenteId)?.nome || ''}
          onSuccess={handleEntradaSuccess}
        />
      )}

      {/* Modal de Saída de Componente */}
      {saidaComponenteId && (
        <ModalSaidaComponente
          isOpen={isSaidaModalOpen}
          onClose={handleCloseSaidaModal}
          componenteId={saidaComponenteId}
          componenteNome={componentes.find(c => c._id === saidaComponenteId)?.nome || ''}
          onSuccess={handleSaidaSuccess}
        />
      )}

      {/* Modal de Excluir Componente */}
      {excluirComponenteId && (
        <ModalExcluirComponente
          isOpen={isExcluirModalOpen}
          onClose={handleCloseExcluirModal}
          componenteId={excluirComponenteId}
          componenteNome={componentes.find(c => c._id === excluirComponenteId)?.nome || ''}
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

export default function ComponentesPage() {
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
      <ComponentesPageContent />
    </Suspense>
  );
}
