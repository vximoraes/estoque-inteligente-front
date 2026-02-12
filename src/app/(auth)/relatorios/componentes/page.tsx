"use client"
import StatCard from "@/components/stat-card";
import Cabecalho from "@/components/cabecalho";
import ModalFiltros from "@/components/modal-filtros";
import ModalExportarRelatorio from "@/components/modal-exportar-relatorio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { EstoqueApiResponse } from '@/types/componentes';
import { Search, Filter, Plus, Package, CheckCircle, AlertTriangle, XCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, Suspense, useRef } from 'react';
import { PulseLoader } from 'react-spinners';
import { generateComponentesPDF } from '@/utils/pdfGenerator';
import { generateComponentesCSV } from '@/utils/csvGenerator';
import { toast, Slide } from 'react-toastify';
import { useSession } from "@/hooks/use-session";

interface CategoriasApiResponse {
  data: {
    docs: any[];
  };
}

function RelatorioComponentesPageContent() {
  const {user} = useSession()
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isExportarModalOpen, setIsExportarModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Buscar estoques com infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<EstoqueApiResponse>({
    queryKey: ['estoques-relatorio', searchTerm, categoriaFilter, statusFilter],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('page', page.toString());

      if (categoriaFilter) {
        params.append('categoria', categoriaFilter);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const queryString = params.toString();
      const url = `/estoques${queryString ? `?${queryString}` : ''}`;

      return await get<EstoqueApiResponse>(url);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Intersection Observer para infinite scroll
  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const todosEstoques = data?.pages.flatMap((page) => page.data.docs) || [];

  // Filtrar estoques localmente baseado no searchTerm, categoriaFilter e statusFilter
  const estoquesFiltrados = todosEstoques
    .filter((estoque) => {
      // Validar se o estoque tem componente e localização
      if (!estoque?.componente || !estoque?.localizacao) {
        return false;
      }

      const matchSearch = !searchTerm || 
        estoque.componente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estoque.componente._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estoque.localizacao.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategoria = !categoriaFilter || 
        estoque.componente.categoria === categoriaFilter;
      
      const matchStatus = !statusFilter || 
        estoque.componente.status === statusFilter;
      
      return matchSearch && matchCategoria && matchStatus;
    })
    .sort((a, b) => {
      // Ordenar alfabeticamente pelo nome do componente
      const nomeA = a.componente?.nome?.toLowerCase() || '';
      const nomeB = b.componente?.nome?.toLowerCase() || '';
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

  // Calcular estatísticas baseadas nos estoques filtrados (com validação extra)
  const totalComponentes = new Set(
    estoquesFiltrados
      .filter(e => e?.componente?._id)
      .map(e => e.componente._id)
  ).size;
  const emEstoque = estoquesFiltrados.filter(e => e?.componente?.status === 'Em Estoque').length;
  const baixoEstoque = estoquesFiltrados.filter(e => e?.componente?.status === 'Baixo Estoque').length;
  const indisponiveis = estoquesFiltrados.filter(e => e?.componente?.status === 'Indisponível').length;

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

  const handleOpenExportarModal = () => {
    setIsExportarModalOpen(true);
  };

  const handleCloseExportarModal = () => {
    setIsExportarModalOpen(false);
  };

  const handleExport = async (fileName: string, format: string) => {
    try {
      // Filtrar apenas os estoques selecionados
      const estoquesSelecionados = estoquesFiltrados.filter(estoque => 
        selectedItems.has(estoque._id)
      );

      if (format === 'PDF') {
        // Gerar PDF
        await generateComponentesPDF({
          estoques: estoquesSelecionados,
          fileName: fileName.trim(),
          title: 'RELATÓRIO DE COMPONENTES',
          includeStats: true,
          userName: user?.name
        });

        toast.success(`PDF gerado com sucesso! ${estoquesSelecionados.length} componente(s) exportado(s).`, {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        });

        // Fechar modal após exportação
        handleCloseExportarModal();
      } else if (format === 'CSV') {
        // Gerar CSV
        generateComponentesCSV({
          estoques: estoquesSelecionados,
          fileName: fileName.trim(),
          includeStats: true,
        });

        toast.success(`CSV gerado com sucesso! ${estoquesSelecionados.length} componente(s) exportado(s).`, {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        });

        // Fechar modal após exportação
        handleCloseExportarModal();
      } else {
        // Formato não implementado ainda
        toast.info('Formato de exportação ainda não implementado', {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        });
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao gerar o relatório. Tente novamente.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
    }
  };

  // Funções para gerenciar seleção de itens
  const handleSelectAll = () => {
    if (selectedItems.size === estoquesFiltrados.length) {
      // Se todos estão selecionados, desmarcar todos
      setSelectedItems(new Set());
    } else {
      // Selecionar todos os itens filtrados
      const allIds = new Set(estoquesFiltrados.map(e => e._id));
      setSelectedItems(allIds);
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const isAllSelected = estoquesFiltrados.length > 0 && selectedItems.size === estoquesFiltrados.length;
  const isSomeSelected = selectedItems.size > 0 && selectedItems.size < estoquesFiltrados.length;

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden" data-test="relatorio-componentes-page">
      <Cabecalho 
        pagina="Relatórios" 
        acao="Componentes"
      />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        {/* Stats Cards - Colapsável no mobile */}
        <div className="shrink-0 mb-6">
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
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isStatsOpen ? 'block mt-4' : 'hidden'} xl:grid xl:mt-0`} data-test="stats-grid">
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

        {/* Barra de Pesquisa e Botões */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0" data-test="search-actions-bar">
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
              disabled={selectedItems.size === 0}
              className={`flex items-center gap-2 text-white transition-all ${
                selectedItems.size > 0
                  ? 'hover:opacity-90 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed bg-gray-400'
              }`}
              style={selectedItems.size > 0 ? { backgroundColor: '#306FCC' } : {}}
              data-test="exportar-button"
              onClick={handleOpenExportarModal}
              title={selectedItems.size === 0 ? 'Selecione componentes para exportar' : `Exportar ${selectedItems.size} componente(s)`}
            >
              <img src="../gerar-pdf.svg" alt="" className="w-5" />
              Exportar
            </Button>
          </div>

        {/* Filtros aplicados */}
        {(categoriaFilter || statusFilter) && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div className="flex flex-wrap items-center gap-2" data-test="filters-container">
              {categoriaFilter && (
                <div data-test="filter-tag-categoria" className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm">
                  <span className="font-medium">Categoria:</span>
                  <span>{categoriasData?.data?.docs?.find((cat: any) => cat._id === categoriaFilter)?.nome || 'Carregando...'}</span>
                  <button
                    onClick={() => setCategoriaFilter('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de categoria"
                    data-test="remove-categoria-filter"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {statusFilter && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm" data-test="filter-tag-status">
                  <span className="font-medium">Status:</span>
                  <span>{statusFilter}</span>
                  <button
                    onClick={() => setStatusFilter('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de status"
                    data-test="remove-status-filter"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded shrink-0"
            data-test="error-message"
            title={`Erro completo: ${error.message}`}
          >
            Erro ao carregar componentes: {error.message}
          </div>
        )}

        {/* Área da Tabela com Scroll */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Carregando componentes...</p>
          </div>
        ) : estoquesFiltrados.length > 0 ? (
          <div className="border rounded-lg bg-white flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1 relative">
              <table className="w-full min-w-[900px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-center w-[50px] px-8" data-test="table-head-checkbox">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = isSomeSelected;
                            }
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 cursor-pointer"
                          title={isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
                          data-test="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8" data-test="table-head-codigo">CÓDIGO</TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8" data-test="table-head-componente">COMPONENTE</TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-center px-8" data-test="table-head-quantidade">QUANTIDADE</TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-center px-8" data-test="table-head-status">STATUS</TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8" data-test="table-head-localizacao">LOCALIZAÇÃO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoquesFiltrados.map((estoque) => (
                      <TableRow data-test="componente-row" key={estoque._id} className="hover:bg-gray-50 border-b" style={{ height: '60px' }}>
                        <TableCell className="text-center px-8 py-3 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(estoque._id)}
                            onChange={() => handleSelectItem(estoque._id)}
                            className="w-4 h-4 cursor-pointer"
                            data-test="checkbox-select-item"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-left px-8 py-3" data-test="componente-codigo">
                          <span className="truncate block max-w-[200px]" title={estoque.componente._id}>
                            {estoque.componente._id.slice(-8)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-left px-8 py-3" data-test="componente-nome">
                          <span className="truncate block max-w-[200px]" title={estoque.componente.nome}>
                            {estoque.componente.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-3 font-medium" data-test="componente-quantidade">
                          {estoque.quantidade}
                        </TableCell>
                        <TableCell className="text-center px-8 py-3 whitespace-nowrap">
                          <div className="flex justify-center" data-test="componente-status">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-[5px] text-xs font-medium text-center whitespace-nowrap ${
                                estoque.componente.status === 'Em Estoque'
                                  ? 'bg-green-100 text-green-800'
                                  : estoque.componente.status === 'Baixo Estoque'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                              title={estoque.componente.status}
                            >
                              {estoque.componente.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-left px-8 py-3 font-medium" data-test="componente-localizacao">
                          <span className="truncate block max-w-[200px]" title={estoque.localizacao.nome}>
                            {estoque.localizacao.nome}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                {/* Observer target for infinite scroll */}
                <div ref={observerTarget} className="h-10 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <PulseLoader color="#3b82f6" size={5} speedMultiplier={0.8} />
                  )}
                </div>
              </div>
            </div>
          ) : (
          <div className="text-center flex-1 flex items-center justify-center bg-white rounded-lg border" data-test="empty-state">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'Nenhum componente encontrado para sua pesquisa.' : 'Não há componentes cadastrados...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Filtros */}
      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={handleCloseFiltrosModal}
        categoriaFilter={categoriaFilter}
        statusFilter={statusFilter}
        onFiltersChange={handleFiltersChange}
        data-test="modal-filtros"
      />

      {/* Modal de Exportar */}
      <ModalExportarRelatorio
        isOpen={isExportarModalOpen}
        onClose={handleCloseExportarModal}
        onExport={handleExport}
      />
    </div>
  );
}

export default function RelatorioComponentesPage() {
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
      <RelatorioComponentesPageContent />
    </Suspense>
  );
}