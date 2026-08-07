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
import { Search, Filter, FileText, X, FileDown } from 'lucide-react';
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

interface MovimentacoesGlobaisStats {
  totalMov: number;
  entradas: number;
  saidas: number;
}

function RelatorioMovimentacoesPageContent() {
  const { user } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isExportarModalOpen, setIsExportarModalOpen] = useState(false);
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

  const { data: globalStats } = useQuery<MovimentacoesGlobaisStats>({
    queryKey: ['movimentacoes-relatorio-global-stats', searchTerm, tipoFilter],
    queryFn: async () => {
      const limit = 500;
      let page = 1;
      let hasNextPage = true;
      const docs: any[] = [];

      while (hasNextPage) {
        const params = new URLSearchParams();
        params.append('limit', String(limit));
        params.append('page', String(page));

        if (tipoFilter) {
          params.append('tipo', tipoFilter.toLowerCase());
        }

        const response = await get<MovimentacoesApiResponse>(
          `/movimentacoes?${params.toString()}`,
        );

        docs.push(...(response?.data?.docs || []));
        hasNextPage = !!response?.data?.hasNextPage;
        page = response?.data?.nextPage || page + 1;
      }

      const normalizeStr = (str: string) => {
        return String(str ?? '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      };

      const filtradas = docs.filter((mov) => {
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
      });

      return {
        totalMov: filtradas.length,
        entradas: filtradas.filter((m) => normalizeStr(m.tipo) === 'entrada')
          .length,
        saidas: filtradas.filter((m) => normalizeStr(m.tipo) === 'saida')
          .length,
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

  const totalMovLocal = movimentacoesFiltradas.length;
  const entradasLocal = movimentacoesFiltradas.filter(
    (m) => normalizeStr(m.tipo) === 'entrada',
  ).length;
  const saidasLocal = movimentacoesFiltradas.filter(
    (m) => normalizeStr(m.tipo) === 'saida',
  ).length;

  const totalMov = globalStats?.totalMov ?? totalMovLocal;
  const entradas = globalStats?.entradas ?? entradasLocal;
  const saidas = globalStats?.saidas ?? saidasLocal;

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
        <div className="shrink-0 mb-6">
          <div
            className="grid grid-cols-3 gap-2 sm:gap-3"
            data-test="stats-grid"
          >
            <StatCard
              title="Total de movimentações"
              value={totalMov}
              data-test="stat-total-movimentacoes"
            />
            <StatCard
              title="Entradas"
              value={entradas}
              data-test="stat-entradas"
            />
            <StatCard title="Saídas" value={saidas} data-test="stat-saidas" />
          </div>
        </div>

        {/* Barra de pesquisa e ações */}
        <div
          className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar movimentações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="search-input"
            />
          </div>

          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer"
            data-test="filtros-button"
            onClick={() => setIsFiltrosModalOpen(true)}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>

          <Button
            disabled={selectedItems.size === 0}
            className={`h-11 px-4 flex items-center gap-2 transition-all ${
              selectedItems.size > 0
                ? 'text-ei-accent-foreground hover:opacity-90 cursor-pointer'
                : 'text-muted-foreground opacity-50 cursor-not-allowed bg-muted'
            }`}
            style={
              selectedItems.size > 0
                ? { backgroundColor: 'var(--ei-accent)' }
                : {}
            }
            data-test="exportar-button"
            onClick={() => setIsExportarModalOpen(true)}
            title={
              selectedItems.size === 0
                ? 'Selecione movimentações para exportar'
                : `Exportar ${selectedItems.size} movimentação(ões)`
            }
          >
            <FileDown className="w-5 h-5" />
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
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
              >
                <span className="font-medium">Tipo:</span>
                <span>{tipoFilter}</span>
                <button
                  onClick={() => setTipoFilter('')}
                  className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  title="Remover filtro de tipo"
                  data-test="remove-tipo-filter"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div
            className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0"
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
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando movimentações...
              </p>
            </div>
          ) : movimentacoesFiltradas.length > 0 ? (
            <div
              className="border border-border rounded-md bg-card flex-1 overflow-hidden flex flex-col"
              data-test="movimentacoes-table-container"
            >
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  className="w-full min-w-[1000px] caption-bottom text-xs sm:text-sm"
                  data-test="movimentacoes-table"
                >
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
                            if (input) input.indeterminate = isSomeSelected;
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 accent-[var(--ei-accent)] cursor-pointer"
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
                        data-test="table-head-produto"
                      >
                        PRODUTO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-quantidade"
                      >
                        QUANTIDADE
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-tipo"
                      >
                        TIPO DE MOVIMENTAÇÃO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-localizacao"
                      >
                        LOCALIZAÇÃO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
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
                        className="hover:bg-muted/35 border-b border-border cursor-pointer"
                        style={{ height: '60px' }}
                        data-test={`movimentacao-row-${mov._id}`}
                        onClick={() => handleSelectItem(mov._id)}
                      >
                        <TableCell
                          className="text-center px-8 py-3 align-middle"
                          data-test="movimentacao-checkbox-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.has(mov._id)}
                            onChange={() => handleSelectItem(mov._id)}
                            className="w-4 h-4 accent-[var(--ei-accent)] cursor-pointer"
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

                              const textoFormatado = isEntrada
                                ? 'Entrada'
                                : isSaida
                                  ? 'Saída'
                                  : String(mov.tipo ?? '').trim() || '-';

                              const bgColor = isEntrada
                                ? 'var(--status-success-bg)'
                                : isSaida
                                  ? 'var(--status-danger-bg)'
                                  : undefined;

                              const textColor = isEntrada
                                ? 'var(--status-success-text)'
                                : isSaida
                                  ? 'var(--status-danger-text)'
                                  : undefined;

                              return (
                                <span
                                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium whitespace-nowrap"
                                  title={textoFormatado}
                                  style={{
                                    color: textColor,
                                    backgroundColor: bgColor,
                                  }}
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
                          className="text-center px-8 py-3 font-medium"
                          data-test="movimentacao-localizacao"
                        >
                          <span
                            className="truncate inline-block max-w-[200px]"
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
                      color="var(--ei-accent)"
                      size={5}
                      data-test="loading-next-page"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-card rounded-md border border-border">
              <EmptyState
                icon={FileText}
                title={
                  searchTerm
                    ? 'Nenhum resultado'
                    : 'Nenhuma movimentação encontrada'
                }
                subtitle={
                  searchTerm
                    ? 'Tente ajustar sua pesquisa.'
                    : 'Não há movimentações para exibir no relatório.'
                }
              />
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
            <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground font-medium">
            Carregando...
          </p>
        </div>
      }
    >
      <RelatorioMovimentacoesPageContent />
    </Suspense>
  );
}
