'use client';
import StatCard from '@/components/stat-card';
import Cabecalho from '@/components/cabecalho';
import ModalFiltros from '@/components/modal-filtros';
import ModalExportarRelatorio from '@/components/modal-exportar-relatorio';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { EstoqueApiResponse } from '@/types/itens';
import { Search, Filter, Package, X } from 'lucide-react';
import { useState, useEffect, Suspense, useRef } from 'react';
import { PulseLoader } from 'react-spinners';
import { generateItensPDF } from '@/utils/pdfGenerator';
import { generateItensCSV } from '@/utils/csvGenerator';
import { toast, Slide } from 'react-toastify';
import { useSession } from '@/hooks/use-session';

interface CategoriasApiResponse {
  data: {
    docs: any[];
  };
}

interface ItensGlobaisStats {
  totalItens: number;
  emEstoque: number;
  baixoEstoque: number;
  indisponiveis: number;
}

function RelatorioItensPageContent() {
  const { user } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isExportarModalOpen, setIsExportarModalOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Buscar estoques com infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<EstoqueApiResponse>({
    queryKey: ['estoques-relatorio', searchTerm, categoriaFilter, statusFilter],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('limite', '20');
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
      { threshold: 0.1 },
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const todosEstoques = data?.pages.flatMap((page) => page.data.docs) || [];

  const { data: globalStats } = useQuery<ItensGlobaisStats>({
    queryKey: [
      'estoques-relatorio-global-stats',
      categoriaFilter,
      statusFilter,
    ],
    queryFn: async () => {
      const limit = 500;
      let page = 1;
      let hasNextPage = true;
      const docs: any[] = [];

      while (hasNextPage) {
        const params = new URLSearchParams();
        params.append('limite', String(limit));
        params.append('page', String(page));

        if (categoriaFilter) {
          params.append('categoria', categoriaFilter);
        }
        if (statusFilter) {
          params.append('status', statusFilter);
        }

        const response = await get<EstoqueApiResponse>(
          `/estoques?${params.toString()}`,
        );
        const pageDocs = response?.data?.docs || [];
        docs.push(...pageDocs);

        hasNextPage = !!response?.data?.hasNextPage;
        page = response?.data?.nextPage || page + 1;
      }

      const filtrados = docs.filter((estoque) => {
        if (!estoque?.item || !estoque?.localizacao) {
          return false;
        }

        const matchCategoria =
          !categoriaFilter || estoque.item.categoria === categoriaFilter;

        const matchStatus =
          !statusFilter || estoque.item.status === statusFilter;

        return matchCategoria && matchStatus;
      });

      return {
        totalItens: new Set(
          filtrados.filter((e) => e?.item?._id).map((e) => e.item._id),
        ).size,
        emEstoque: filtrados.filter((e) => e?.item?.status === 'Em Estoque')
          .length,
        baixoEstoque: filtrados.filter(
          (e) => e?.item?.status === 'Baixo Estoque',
        ).length,
        indisponiveis: filtrados.filter(
          (e) => e?.item?.status === 'Indisponível',
        ).length,
      };
    },
    staleTime: 30_000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Filtrar estoques localmente baseado no searchTerm, categoriaFilter e statusFilter
  const estoquesFiltrados = todosEstoques
    .filter((estoque) => {
      // Validar se o estoque tem item e localização
      if (!estoque?.item || !estoque?.localizacao) {
        return false;
      }

      const matchSearch =
        !searchTerm ||
        estoque.item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estoque.item._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estoque.localizacao.nome
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchCategoria =
        !categoriaFilter || estoque.item.categoria === categoriaFilter;

      const matchStatus = !statusFilter || estoque.item.status === statusFilter;

      return matchSearch && matchCategoria && matchStatus;
    })
    .sort((a, b) => {
      // Ordenar alfabeticamente pelo nome do item
      const nomeA = a.item?.nome?.toLowerCase() || '';
      const nomeB = b.item?.nome?.toLowerCase() || '';
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

  // Calcular estatísticas baseadas nos estoques filtrados (com validação extra)
  const totalItens = new Set(
    estoquesFiltrados.filter((e) => e?.item?._id).map((e) => e.item._id),
  ).size;
  const emEstoqueLocal = estoquesFiltrados.filter(
    (e) => e?.item?.status === 'Em Estoque',
  ).length;
  const baixoEstoqueLocal = estoquesFiltrados.filter(
    (e) => e?.item?.status === 'Baixo Estoque',
  ).length;
  const indisponiveisLocal = estoquesFiltrados.filter(
    (e) => e?.item?.status === 'Indisponível',
  ).length;

  const totalItensGlobal = globalStats?.totalItens ?? totalItens;
  const emEstoque = globalStats?.emEstoque ?? emEstoqueLocal;
  const baixoEstoque = globalStats?.baixoEstoque ?? baixoEstoqueLocal;
  const indisponiveis = globalStats?.indisponiveis ?? indisponiveisLocal;

  // Query para buscar categorias para mostrar o nome nos filtros
  const { data: categoriasData } = useQuery<CategoriasApiResponse>({
    queryKey: ['categorias'],
    queryFn: async () => {
      return await get<CategoriasApiResponse>('/categorias?limite=100&page=1');
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
      const estoquesSelecionados = estoquesFiltrados.filter((estoque) =>
        selectedItems.has(estoque._id),
      );

      if (format === 'PDF') {
        // Gerar PDF
        await generateItensPDF({
          estoques: estoquesSelecionados,
          fileName: fileName.trim(),
          title: 'RELATÓRIO DE ITENS',
          includeStats: true,
          userName: user?.name,
        });

        toast.success(
          `PDF gerado com sucesso! ${estoquesSelecionados.length} item(ns) exportado(s).`,
          {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            transition: Slide,
          },
        );

        // Fechar modal após exportação
        handleCloseExportarModal();
      } else if (format === 'CSV') {
        // Gerar CSV
        generateItensCSV({
          estoques: estoquesSelecionados,
          fileName: fileName.trim(),
          includeStats: true,
        });

        toast.success(
          `CSV gerado com sucesso! ${estoquesSelecionados.length} item(ns) exportado(s).`,
          {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            transition: Slide,
          },
        );

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
      const allIds = new Set(estoquesFiltrados.map((e) => e._id));
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

  const isAllSelected =
    estoquesFiltrados.length > 0 &&
    selectedItems.size === estoquesFiltrados.length;
  const isSomeSelected =
    selectedItems.size > 0 && selectedItems.size < estoquesFiltrados.length;

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="relatorio-itens-page"
    >
      <Cabecalho pagina="Relatórios" acao="Itens" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        <div className="shrink-0 mb-6">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
            data-test="stats-grid"
          >
            <StatCard
              title="Total de itens"
              value={totalItensGlobal}
              data-test="stat-total-itens"
              hoverTitle={`Total de itens cadastrados: ${totalItensGlobal}`}
            />
            <StatCard
              title="Em estoque"
              value={emEstoque}
              data-test="stat-em-estoque"
              hoverTitle={`Itens disponíveis em estoque: ${emEstoque}`}
            />
            <StatCard
              title="Baixo estoque"
              value={baixoEstoque}
              data-test="stat-baixo-estoque"
              hoverTitle={`Itens com baixo estoque: ${baixoEstoque}`}
            />
            <StatCard
              title="Indisponível"
              value={indisponiveis}
              data-test="stat-indisponiveis"
              hoverTitle={`Itens indisponíveis: ${indisponiveis}`}
            />
          </div>
        </div>

        {/* Barra de Pesquisa e Botões */}
        <div
          className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[#306FCC]/35 focus-visible:border-[#306FCC]"
              data-test="search-input"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer"
            data-test="filtros-button"
            onClick={handleOpenFiltrosModal}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button
            disabled={selectedItems.size === 0}
            className={`h-11 px-4 flex items-center gap-2 text-white transition-all ${
              selectedItems.size > 0
                ? 'hover:opacity-90 cursor-pointer'
                : 'opacity-50 cursor-not-allowed bg-gray-400'
            }`}
            style={selectedItems.size > 0 ? { backgroundColor: '#306FCC' } : {}}
            data-test="exportar-button"
            onClick={handleOpenExportarModal}
            title={
              selectedItems.size === 0
                ? 'Selecione itens para exportar'
                : `Exportar ${selectedItems.size} item(ns)`
            }
          >
            <img src="../gerar-pdf.svg" alt="" className="w-5" />
            Exportar
          </Button>
        </div>

        {/* Filtros aplicados */}
        {(categoriaFilter || statusFilter) && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div
              className="flex flex-wrap items-center gap-2"
              data-test="filters-container"
            >
              {categoriaFilter && (
                <div
                  data-test="filter-tag-categoria"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                >
                  <span className="font-medium">Categoria:</span>
                  <span>
                    {categoriasData?.data?.docs?.find(
                      (cat: any) => cat._id === categoriaFilter,
                    )?.nome || 'Carregando...'}
                  </span>
                  <button
                    onClick={() => setCategoriaFilter('')}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de categoria"
                    data-test="remove-categoria-filter"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {statusFilter && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                  data-test="filter-tag-status"
                >
                  <span className="font-medium">Status:</span>
                  <span>{statusFilter}</span>
                  <button
                    onClick={() => setStatusFilter('')}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de status"
                    data-test="remove-status-filter"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div
            className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded shrink-0"
            data-test="error-message"
            title={`Erro completo: ${error.message}`}
          >
            Erro ao carregar itens: {error.message}
          </div>
        )}

        {/* Área da Tabela com Scroll */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#306FCC]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#306FCC] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando itens...
              </p>
            </div>
          ) : estoquesFiltrados.length > 0 ? (
            <div className="border border-border rounded-lg bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[900px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center w-[50px] px-8"
                        data-test="table-head-checkbox"
                      >
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
                          title={
                            isAllSelected
                              ? 'Desmarcar todos'
                              : 'Selecionar todos'
                          }
                          data-test="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-left px-8"
                        data-test="table-head-codigo"
                      >
                        CÓDIGO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-left px-8"
                        data-test="table-head-item"
                      >
                        COMPONENTE
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-quantidade"
                      >
                        QUANTIDADE
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-status"
                      >
                        STATUS
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-localizacao"
                      >
                        LOCALIZAÇÃO
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoquesFiltrados.map((estoque) => (
                      <TableRow
                        data-test="item-row"
                        key={estoque._id}
                        className="hover:bg-muted/35 border-b border-border cursor-pointer"
                        style={{ height: '60px' }}
                        onClick={() => handleSelectItem(estoque._id)}
                      >
                        <TableCell
                          className="text-center px-8 py-3 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.has(estoque._id)}
                            onChange={() => handleSelectItem(estoque._id)}
                            className="w-4 h-4 cursor-pointer"
                            data-test="checkbox-select-item"
                          />
                        </TableCell>
                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="item-codigo"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={estoque.item._id}
                          >
                            {estoque.item._id.slice(-8)}
                          </span>
                        </TableCell>
                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="item-nome"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={estoque.item.nome}
                          >
                            {estoque.item.nome}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-center px-8 py-3 font-medium"
                          data-test="item-quantidade"
                        >
                          {estoque.quantidade}
                        </TableCell>
                        <TableCell className="text-center px-8 py-3 whitespace-nowrap">
                          <div
                            className="flex justify-center"
                            data-test="item-status"
                          >
                            <span
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-[5px] border border-current/30 text-xs font-medium whitespace-nowrap"
                              title={estoque.item.status}
                              style={{
                                color:
                                  estoque.item.status === 'Em Estoque'
                                    ? 'oklch(0.448 0.119 151.328)'
                                    : estoque.item.status === 'Baixo Estoque'
                                      ? 'oklch(0.473 0.137 46.201)'
                                      : 'oklch(0.444 0.177 26.899)',
                                backgroundColor:
                                  estoque.item.status === 'Em Estoque'
                                    ? 'oklch(0.962 0.044 156.743)'
                                    : estoque.item.status === 'Baixo Estoque'
                                      ? 'oklch(0.962 0.059 95.617)'
                                      : 'oklch(0.936 0.032 17.717)',
                              }}
                            >
                              {estoque.item.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-center px-8 py-3 font-medium"
                          data-test="item-localizacao"
                        >
                          <span
                            className="truncate inline-block max-w-[200px]"
                            title={estoque.localizacao.nome}
                          >
                            {estoque.localizacao.nome}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                {/* Observer target for infinite scroll */}
                <div
                  ref={observerTarget}
                  className="h-10 flex items-center justify-center"
                >
                  {isFetchingNextPage && (
                    <PulseLoader
                      color="#3b82f6"
                      size={5}
                      speedMultiplier={0.8}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-card rounded-lg border border-border">
              <EmptyState
                icon={Package}
                title={
                  searchTerm ? 'Nenhum resultado' : 'Nenhum item encontrado'
                }
                subtitle={
                  searchTerm
                    ? 'Tente ajustar sua pesquisa.'
                    : 'Não há itens para exibir no relatório.'
                }
              />
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

export default function RelatorioItensPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-[#306FCC]/15"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#306FCC] border-r-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground font-medium">
            Carregando...
          </p>
        </div>
      }
    >
      <RelatorioItensPageContent />
    </Suspense>
  );
}
