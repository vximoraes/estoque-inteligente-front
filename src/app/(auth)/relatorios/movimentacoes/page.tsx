'use client';

import StatCard from '@/components/stat-card';
import Cabecalho from '@/components/cabecalho';
import ModalFiltros from '@/components/modal-filtros';
import ModalExportarRelatorio from '@/components/modal-exportar-relatorio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import {
  Search,
  Filter,
  ArrowDownUp,
  ArrowUpDown,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import { PulseLoader } from 'react-spinners';
import { toast, Slide } from 'react-toastify';
import { useSession } from '@/hooks/use-session';
import { generateMovimentacoesPDF } from '@/utils/pdfGenerator';
import { generateMovimentacoesCSV } from '@/utils/csvGenerator';

interface MovimentacoesApiResponse {
  data: {
    docs: any[];
    hasNextPage: boolean;
    nextPage?: number;
  };
}

function RelatorioMovimentacoesPageContent() {
  const { user } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isExportarModalOpen, setIsExportarModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MovimentacoesApiResponse>({
    queryKey: ['movimentacoes-relatorio', searchTerm, tipoFilter],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('page', page.toString());

      if (tipoFilter) {
        params.append('tipo', tipoFilter.toLowerCase());
      }

      const queryString = params.toString();
      const url = `/movimentacoes${queryString ? `?${queryString}` : ''}`;

      return await get<MovimentacoesApiResponse>(url);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

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

  const todasMovimentacoes =
    data?.pages.flatMap((page) => page.data.docs) || [];

  const normalizeStr = (str: string) => {
    return String(str ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const movimentacoesFiltradas = todasMovimentacoes
    .filter((mov) => {
      const texto = searchTerm.toLowerCase();

      const matchSearch =
        !searchTerm ||
        mov.item?._id?.toLowerCase().includes(texto) ||
        mov.item?.nome?.toLowerCase().includes(texto) ||
        mov.localizacao?.nome?.toLowerCase().includes(texto) ||
        mov.tipo?.toLowerCase().includes(texto) ||
        String(mov.quantidade).includes(searchTerm) ||
        new Date(mov.data_hora)
          .toLocaleString('pt-BR')
          .toLowerCase()
          .includes(texto);

      const tipoMovNormalized = normalizeStr(mov.tipo);
      const filterNormalized = normalizeStr(tipoFilter);

      const matchTipo =
        !filterNormalized ||
        tipoMovNormalized === filterNormalized ||
        tipoMovNormalized.includes(filterNormalized);

      return matchSearch && matchTipo;
    })
    .sort((a, b) => {
      return new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime();
    });

  const totalMov = movimentacoesFiltradas.length;
  const entradas = movimentacoesFiltradas.filter(
    (m) => normalizeStr(m.tipo) === 'entrada',
  ).length;
  const saidas = movimentacoesFiltradas.filter(
    (m) => normalizeStr(m.tipo) === 'saida',
  ).length;

  const handleSelectAll = () => {
    if (selectedItems.size === movimentacoesFiltradas.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(movimentacoesFiltradas.map((m) => m._id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const isAllSelected =
    movimentacoesFiltradas.length > 0 &&
    selectedItems.size === movimentacoesFiltradas.length;
  const isSomeSelected =
    selectedItems.size > 0 &&
    selectedItems.size < movimentacoesFiltradas.length;

  const handleExport = async (fileName: string, format: string) => {
    try {
      const selecionadas = movimentacoesFiltradas.filter((m) =>
        selectedItems.has(m._id),
      );

      if (format === 'PDF') {
        await generateMovimentacoesPDF({
          movimentacoes: selecionadas,
          fileName: fileName.trim(),
          title: 'RELATÓRIO DE MOVIMENTAÇÕES',
          includeStats: true,
          userName: user?.name,
        });
        toast.success('PDF gerado com sucesso!', {
          position: 'bottom-right',
          autoClose: 3000,
          transition: Slide,
        });
      } else {
        generateMovimentacoesCSV({
          movimentacoes: selecionadas,
          fileName: fileName.trim(),
          includeStats: true,
        });
        toast.success('CSV gerado com sucesso!', {
          position: 'bottom-right',
          autoClose: 3000,
          transition: Slide,
        });
      }
      setIsExportarModalOpen(false);
    } catch {
      toast.error('Erro ao exportar relatório.', {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      });
    }
  };

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="relatorio-movimentacoes-page"
    >
      <Cabecalho pagina="Relatórios" acao="Movimentações" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        {/* Stats */}
        <div className="shrink-0 mb-6">
          <button
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="xl:hidden w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors h-10 cursor-pointer"
            data-test="toggle-stats-button"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Estatísticas</span>
            </div>
            {isStatsOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${
              isStatsOpen ? 'block mt-4' : 'hidden'
            } xl:grid xl:mt-0`}
            data-test="stats-grid"
          >
            <StatCard
              title="Total de"
              subtitle="movimentações"
              value={totalMov}
              icon={FileText}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              data-test="stat-total-movimentacoes"
            />
            <StatCard
              title="Entradas"
              value={entradas}
              icon={ArrowDownUp}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              data-test="stat-entradas"
            />
            <StatCard
              title="Saídas"
              value={saidas}
              icon={ArrowUpDown}
              iconColor="text-yellow-600"
              iconBgColor="bg-yellow-100"
              data-test="stat-saidas"
            />
          </div>
        </div>

        {/* Barra de pesquisa e ações */}
        <div
          className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar movimentações..."
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
            onClick={() => setIsFiltrosModalOpen(true)}
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
            onClick={() => setIsExportarModalOpen(true)}
            title={
              selectedItems.size === 0
                ? 'Selecione movimentações para exportar'
                : `Exportar ${selectedItems.size} movimentação(ões)`
            }
          >
            <img src="../gerar-pdf.svg" alt="" className="w-5" />
            Exportar
          </Button>
        </div>

        {/* Filtro aplicado */}
        {tipoFilter && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div
              className="flex flex-wrap items-center gap-2"
              data-test="filters-container"
            >
              <div
                data-test="filter-tag-tipo"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm"
              >
                <span className="font-medium">Tipo:</span>
                <span>{tipoFilter}</span>
                <button
                  onClick={() => setTipoFilter('')}
                  className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                  title="Remover filtro de tipo"
                  data-test="remove-tipo-filter"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded shrink-0"
            data-test="error-message"
          >
            Erro ao carregar movimentações: {error.message}
          </div>
        )}

        {/* Tabela */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center flex-1"
              data-test="loading-spinner"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Carregando movimentações...
              </p>
            </div>
          ) : movimentacoesFiltradas.length > 0 ? (
            <div
              className="border rounded-lg bg-white flex-1 overflow-hidden flex flex-col"
              data-test="movimentacoes-table-container"
            >
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  className="w-full min-w-[1000px] caption-bottom text-xs sm:text-sm"
                  data-test="movimentacoes-table"
                >
                  <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-center w-[50px] px-8"
                        data-test="table-head-checkbox"
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = isSomeSelected;
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 cursor-pointer"
                          data-test="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-left px-8"
                        data-test="table-head-codigo"
                      >
                        CÓDIGO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-left px-8"
                        data-test="table-head-produto"
                      >
                        PRODUTO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-center px-8"
                        data-test="table-head-quantidade"
                      >
                        QUANTIDADE
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-center px-8"
                        data-test="table-head-tipo"
                      >
                        TIPO DE MOVIMENTAÇÃO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-left px-8"
                        data-test="table-head-localizacao"
                      >
                        LOCALIZAÇÃO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-center px-8"
                        data-test="table-head-data"
                      >
                        DATA/HORA
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody data-test="movimentacoes-table-body">
                    {movimentacoesFiltradas.map((mov) => (
                      <TableRow
                        key={mov._id}
                        className="hover:bg-gray-50 border-b"
                        style={{ height: '60px' }}
                        data-test={`movimentacao-row-${mov._id}`}
                      >
                        <TableCell
                          className="text-center px-8 py-3 align-middle"
                          data-test="movimentacao-checkbox-cell"
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.has(mov._id)}
                            onChange={() => handleSelectItem(mov._id)}
                            className="w-4 h-4 cursor-pointer"
                            data-test={`checkbox-item-${mov._id}`}
                          />
                        </TableCell>

                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="movimentacao-codigo"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={mov.item?._id || mov._id}
                          >
                            {mov.item?._id?.slice(-8) ||
                              mov._id?.slice(-8) ||
                              '—'}
                          </span>
                        </TableCell>

                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="movimentacao-produto"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={mov.item?.nome || 'Sem nome'}
                          >
                            {mov.item?.nome || 'Sem nome'}
                          </span>
                        </TableCell>

                        <TableCell
                          className="text-center px-8 py-3 font-medium"
                          data-test="movimentacao-quantidade"
                        >
                          {mov.quantidade}
                        </TableCell>

                        <TableCell
                          className="text-center px-8 py-3 whitespace-nowrap"
                          data-test="movimentacao-tipo"
                        >
                          <div className="flex justify-center">
                            {(() => {
                              const tipoRaw = String(
                                mov.tipo ?? '',
                              ).toLowerCase();
                              const isEntrada = tipoRaw.includes('entrada');
                              const isSaida =
                                tipoRaw.includes('saída') ||
                                tipoRaw.includes('saida');

                              const classes = isEntrada
                                ? 'bg-green-100 text-green-800'
                                : isSaida
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800';

                              const textoFormatado = isEntrada
                                ? 'Entrada'
                                : isSaida
                                  ? 'Saída'
                                  : String(mov.tipo ?? '').trim() || '-';

                              return (
                                <span
                                  className={`inline-flex items-center justify-center px-3 py-1.5 rounded-[5px] text-xs font-medium text-center whitespace-nowrap ${classes}`}
                                  title={textoFormatado}
                                  data-test={`badge-tipo-${
                                    isEntrada
                                      ? 'entrada'
                                      : isSaida
                                        ? 'saida'
                                        : 'outro'
                                  }`}
                                >
                                  {textoFormatado}
                                </span>
                              );
                            })()}
                          </div>
                        </TableCell>

                        <TableCell
                          className="text-left px-8 py-3 font-medium"
                          data-test="movimentacao-localizacao"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={mov.localizacao?.nome || '-'}
                          >
                            {mov.localizacao?.nome || '-'}
                          </span>
                        </TableCell>

                        <TableCell
                          className="text-center px-8 py-3 font-medium whitespace-nowrap"
                          data-test="movimentacao-data"
                        >
                          <span
                            className="truncate block max-w-[150px]"
                            title={new Date(mov.data_hora).toLocaleString(
                              'pt-BR',
                            )}
                          >
                            {new Date(mov.data_hora).toLocaleString('pt-BR')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                <div
                  ref={observerTarget}
                  className="h-10 flex items-center justify-center"
                  data-test="infinite-scroll-observer"
                >
                  {isFetchingNextPage && (
                    <PulseLoader
                      color="#3b82f6"
                      size={5}
                      data-test="loading-next-page"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="text-center flex-1 flex items-center justify-center bg-white rounded-lg border"
              data-test="empty-state"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? 'Nenhuma movimentação encontrada para sua pesquisa.'
                    : 'Não há movimentações cadastradas...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={() => setIsFiltrosModalOpen(false)}
        categoriaFilter=""
        statusFilter={tipoFilter}
        onFiltersChange={(_, status) => {
          let tipo = String(status ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

          if (tipo === 'entrada') tipo = 'entrada';
          else if (tipo === 'saida') tipo = 'saida';
          else tipo = '';

          setTipoFilter(tipo);
        }}
        statusOptions={[
          { value: '', label: 'Todos' },
          { value: 'Entrada', label: 'Entrada' },
          { value: 'Saída', label: 'Saída' },
        ]}
        showCategoria={false}
      />

      <ModalExportarRelatorio
        isOpen={isExportarModalOpen}
        onClose={() => setIsExportarModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}

export default function RelatorioMovimentacoesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full h-screen flex flex-col items-center justify-center"
          data-test="page-suspense-fallback"
        >
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Carregando...</p>
        </div>
      }
    >
      <RelatorioMovimentacoesPageContent />
    </Suspense>
  );
}
