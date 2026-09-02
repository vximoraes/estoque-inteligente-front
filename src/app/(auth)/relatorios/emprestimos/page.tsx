'use client';

import StatCard from '@/app/(auth)/relatorios/_components/stat-card';
import Cabecalho from '@/components/layout/cabecalho';
import ModalFiltros from '@/components/comum/modal-filtros';
import ModalExportarRelatorio from '@/app/(auth)/relatorios/_components/modal-exportar-relatorio';
import EmptyState from '@/components/comum/empty-state';
import OrdenarPorSelect from '@/components/comum/ordenar-por-select';
import { ORDENACAO_EMPRESTIMOS } from '@/lib/ordenacao';
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
import { EmprestimosApiResponse, Emprestimo } from '@/types/emprestimos';
import {
  Search,
  SlidersHorizontal,
  Handshake,
  X,
  FileDown,
} from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import { PulseLoader } from 'react-spinners';
import { toast, Slide } from 'react-toastify';
import { useSession } from '@/hooks/use-session';
import { generateEmprestimosPDF } from '@/utils/pdfGenerator';
import { generateEmprestimosCSV } from '@/utils/csvGenerator';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Atrasado', label: 'Atrasado' },
  { value: 'Devolvido', label: 'Devolvido' },
];

const TIPO_CONTROLE_LABEL: Record<'quantidade' | 'unidade', string> = {
  quantidade: 'Almoxarifado',
  unidade: 'Patrimônio',
};

interface EmprestimosGlobaisStats {
  total: number;
  ativos: number;
  atrasados: number;
  devolvidos: number;
}

function buildParams(
  page: number,
  limit: number,
  searchTerm: string,
  statusFilter: string,
  tipoControle: 'quantidade' | 'unidade',
  ordenar: string,
) {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limite', limit.toString());
  params.append('tipo_controle', tipoControle);

  if (searchTerm) params.append('busca', searchTerm);
  if (statusFilter === 'Ativo') params.append('apenas_abertos', 'true');
  if (statusFilter === 'Atrasado') params.append('atrasados', 'true');
  if (ordenar) params.append('ordenar', ordenar);

  return params;
}

function RelatorioEmprestimosPageContent() {
  const { user } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoControle, setTipoControle] = useState<'quantidade' | 'unidade'>(
    'unidade',
  );
  const [ordenar, setOrdenar] = useState('');
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
  } = useInfiniteQuery<EmprestimosApiResponse>({
    queryKey: [
      'emprestimos-relatorio',
      searchTerm,
      statusFilter,
      tipoControle,
      ordenar,
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = buildParams(
        page,
        20,
        searchTerm,
        statusFilter,
        tipoControle,
        ordenar,
      );

      return await get<EmprestimosApiResponse>(
        `/emprestimos?${params.toString()}`,
      );
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

  const todosEmprestimos = data?.pages.flatMap((page) => page.data.docs) || [];

  const { data: globalStats } = useQuery<EmprestimosGlobaisStats>({
    queryKey: [
      'emprestimos-relatorio-global-stats',
      searchTerm,
      statusFilter,
      tipoControle,
    ],
    queryFn: async () => {
      const limit = 500;
      let page = 1;
      let hasNextPage = true;
      const docs: Emprestimo[] = [];

      while (hasNextPage) {
        const params = buildParams(
          page,
          limit,
          searchTerm,
          statusFilter,
          tipoControle,
          '',
        );

        const response = await get<EmprestimosApiResponse>(
          `/emprestimos?${params.toString()}`,
        );

        docs.push(...(response?.data?.docs || []));
        hasNextPage = !!response?.data?.hasNextPage;
        page = response?.data?.nextPage || page + 1;
      }

      // `busca`/`apenas_abertos`/`atrasados` já filtraram no servidor —
      // "Devolvido" não tem parâmetro equivalente na API (mesma lacuna da
      // tela original de empréstimos), então os docs aqui já são o universo
      // correto pros três primeiros contadores.
      return {
        total: docs.length,
        ativos: docs.filter((e) => e.status === 'Ativo').length,
        atrasados: docs.filter((e) => e.status === 'Atrasado').length,
        devolvidos: docs.filter((e) => e.status === 'Devolvido').length,
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

  // Busca/status/ordenação já delegados à API, igual à tela original de
  // empréstimos (que também não reaplica filtro client-side).
  const emprestimosFiltrados = todosEmprestimos;

  const totalLocal = emprestimosFiltrados.length;
  const ativosLocal = emprestimosFiltrados.filter(
    (e) => e.status === 'Ativo',
  ).length;
  const atrasadosLocal = emprestimosFiltrados.filter(
    (e) => e.status === 'Atrasado',
  ).length;
  const devolvidosLocal = emprestimosFiltrados.filter(
    (e) => e.status === 'Devolvido',
  ).length;

  const total = globalStats?.total ?? totalLocal;
  const ativos = globalStats?.ativos ?? ativosLocal;
  const atrasados = globalStats?.atrasados ?? atrasadosLocal;
  const devolvidos = globalStats?.devolvidos ?? devolvidosLocal;

  const formatarData = (data?: string | null) => {
    if (!data) return 'Sem previsão';
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return 'Sem previsão';
    return parsed.toLocaleString('pt-BR');
  };

  const handleSelectAll = () => {
    if (selectedItems.size === emprestimosFiltrados.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(emprestimosFiltrados.map((e) => e._id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const isAllSelected =
    emprestimosFiltrados.length > 0 &&
    selectedItems.size === emprestimosFiltrados.length;
  const isSomeSelected =
    selectedItems.size > 0 && selectedItems.size < emprestimosFiltrados.length;

  const handleExport = async (fileName: string, format: string) => {
    try {
      const selecionados = emprestimosFiltrados.filter((e) =>
        selectedItems.has(e._id),
      );

      if (format === 'PDF') {
        await generateEmprestimosPDF({
          emprestimos: selecionados,
          fileName: fileName.trim(),
          title: 'RELATÓRIO DE EMPRÉSTIMOS',
          includeStats: true,
          userName: user?.name,
        });
        toast.success('PDF gerado com sucesso!', {
          position: 'bottom-right',
          autoClose: 3000,
          transition: Slide,
        });
      } else {
        generateEmprestimosCSV({
          emprestimos: selecionados,
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
      data-test="relatorio-emprestimos-page"
    >
      <Cabecalho pagina="Relatórios" acao="Empréstimos" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        <div
          className="flex gap-1 mb-4 shrink-0 border-b border-border"
          data-test="emprestimos-tabs"
        >
          {(['unidade', 'quantidade'] as const).map((opcaoTipoControle) => (
            <button
              key={opcaoTipoControle}
              type="button"
              onClick={() => setTipoControle(opcaoTipoControle)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                tipoControle === opcaoTipoControle
                  ? 'border-[var(--ei-accent)] text-[var(--ei-accent)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-test={`emprestimos-tab-${opcaoTipoControle}`}
            >
              {TIPO_CONTROLE_LABEL[opcaoTipoControle]}
            </button>
          ))}
        </div>

        <div className="shrink-0 mb-6">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
            data-test="stats-grid"
          >
            <StatCard
              title="Total de empréstimos"
              value={total}
              data-test="stat-total-emprestimos"
            />
            <StatCard title="Ativos" value={ativos} data-test="stat-ativos" />
            <StatCard
              title="Atrasados"
              value={atrasados}
              data-test="stat-atrasados"
            />
            <StatCard
              title="Devolvidos"
              value={devolvidos}
              data-test="stat-devolvidos"
            />
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
              placeholder="Pesquisar por item, solicitante ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="search-input"
            />
          </div>

          <OrdenarPorSelect
            value={ordenar}
            onChange={setOrdenar}
            opcoes={ORDENACAO_EMPRESTIMOS}
          />

          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer"
            data-test="filtros-button"
            onClick={() => setIsFiltrosModalOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
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
                ? 'Selecione empréstimos para exportar'
                : `Exportar ${selectedItems.size} empréstimo(s)`
            }
          >
            <FileDown className="w-5 h-5" />
            Exportar
          </Button>
        </div>

        {/* Filtro aplicado */}
        {statusFilter && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div
              className="flex flex-wrap items-center gap-2"
              data-test="filters-container"
            >
              <div
                data-test="filter-tag-status"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
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
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div
            className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0"
            data-test="error-message"
          >
            Erro ao carregar empréstimos: {error.message}
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
                Carregando empréstimos...
              </p>
            </div>
          ) : emprestimosFiltrados.length > 0 ? (
            <div
              className="border border-border rounded-md bg-card flex-1 overflow-hidden flex flex-col"
              data-test="emprestimos-table-container"
            >
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  className="w-full min-w-[1000px] caption-bottom text-xs sm:text-sm"
                  data-test="emprestimos-table"
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
                        data-test="table-head-item"
                      >
                        ITEM
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-left px-8"
                        data-test="table-head-solicitante"
                      >
                        SOLICITANTE
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-quantidade"
                      >
                        QTD. EMPRESTADA
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-status"
                      >
                        STATUS
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-data-saida"
                      >
                        DATA SAÍDA
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-data-prevista"
                      >
                        DATA PREVISTA
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody data-test="emprestimos-table-body">
                    {emprestimosFiltrados.map((emp) => (
                      <TableRow
                        key={emp._id}
                        className="hover:bg-muted/35 border-b border-border cursor-pointer"
                        style={{ height: '60px' }}
                        data-test={`emprestimo-row-${emp._id}`}
                        onClick={() => handleSelectItem(emp._id)}
                      >
                        <TableCell
                          className="text-center px-8 py-3 align-middle"
                          data-test="emprestimo-checkbox-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.has(emp._id)}
                            onChange={() => handleSelectItem(emp._id)}
                            className="w-4 h-4 accent-[var(--ei-accent)] cursor-pointer"
                            data-test={`checkbox-item-${emp._id}`}
                          />
                        </TableCell>

                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="emprestimo-item"
                        >
                          {(() => {
                            const descricao =
                              emp.item?.nome ||
                              (emp.patrimonio
                                ? `${emp.patrimonio.numero_patrimonio} — ${emp.patrimonio.modelo || 'Patrimônio'}`
                                : '-');
                            return (
                              <span
                                className="truncate block max-w-[200px]"
                                title={descricao}
                              >
                                {descricao}
                              </span>
                            );
                          })()}
                        </TableCell>

                        <TableCell
                          className="text-left px-8 py-3"
                          data-test="emprestimo-solicitante"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={emp.solicitante_nome}
                          >
                            {emp.solicitante_nome}
                          </span>
                        </TableCell>

                        <TableCell
                          className="text-center px-8 py-3 font-medium"
                          data-test="emprestimo-quantidade"
                        >
                          {emp.quantidade_emprestada}
                        </TableCell>

                        <TableCell
                          className="text-center px-8 py-3"
                          data-test="emprestimo-status"
                        >
                          <span
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium text-center whitespace-nowrap bg-muted text-muted-foreground"
                            style={
                              emp.status === 'Ativo'
                                ? {
                                    backgroundColor: 'var(--status-success-bg)',
                                    color: 'var(--status-success-text)',
                                  }
                                : emp.status === 'Atrasado'
                                  ? {
                                      backgroundColor:
                                        'var(--status-danger-bg)',
                                      color: 'var(--status-danger-text)',
                                    }
                                  : undefined
                            }
                            data-test={`badge-status-${emp.status.toLowerCase()}`}
                          >
                            {emp.status}
                          </span>
                        </TableCell>

                        <TableCell
                          className="text-center px-8 py-3 font-medium whitespace-nowrap"
                          data-test="emprestimo-data-saida"
                        >
                          <span
                            className="truncate block max-w-[150px]"
                            title={formatarData(emp.data_saida)}
                          >
                            {formatarData(emp.data_saida)}
                          </span>
                        </TableCell>

                        <TableCell
                          className="text-center px-8 py-3 font-medium whitespace-nowrap"
                          data-test="emprestimo-data-prevista"
                        >
                          <span
                            className="truncate block max-w-[150px]"
                            title={formatarData(emp.data_prevista_devolucao)}
                          >
                            {formatarData(emp.data_prevista_devolucao)}
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
                icon={Handshake}
                title={
                  searchTerm || statusFilter
                    ? 'Nenhum resultado'
                    : 'Nenhum empréstimo encontrado'
                }
                subtitle={
                  searchTerm || statusFilter
                    ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                    : 'Não há empréstimos para exibir no relatório.'
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
        statusFilter={statusFilter}
        onFiltersChange={(_categoria, status) => setStatusFilter(status)}
        statusOptions={statusOptions}
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

export default function RelatorioEmprestimosPage() {
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
      <RelatorioEmprestimosPageContent />
    </Suspense>
  );
}
