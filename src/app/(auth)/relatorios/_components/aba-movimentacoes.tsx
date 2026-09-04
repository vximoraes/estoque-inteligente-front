'use client';

import StatCard from '@/app/(auth)/relatorios/_components/stat-card';
import ModalExportarRelatorio from '@/app/(auth)/relatorios/_components/modal-exportar-relatorio';
import FiltroPeriodo from '@/app/(auth)/relatorios/_components/filtro-periodo';
import FiltroLocalizacao from '@/app/(auth)/relatorios/_components/filtro-localizacao';
import EmptyState from '@/components/comum/empty-state';
import OrdenarPorSelect from '@/components/comum/ordenar-por-select';
import { ORDENACAO_MOVIMENTACOES } from '@/lib/ordenacao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import type {
  MovimentacaoApiResponse,
  MovimentacaoResumoApiResponse,
} from '@/types/movimentacoes';
import { ArrowRightLeft, FileDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PulseLoader } from 'react-spinners';
import { toast, Slide } from 'react-toastify';
import { useSession } from '@/hooks/use-session';
import { generateMovimentacoesPDF } from '@/utils/pdfGenerator';
import { generateMovimentacoesCSV } from '@/utils/csvGenerator';

function ultimosDias(dias: number) {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  return {
    inicio: inicio.toISOString().slice(0, 10),
    fim: fim.toISOString().slice(0, 10),
  };
}

function buildParams(
  page: number,
  limit: number,
  dataInicio: string,
  dataFim: string,
  localizacaoFilter: string,
  tipoFilter: string,
  ordenar: string,
  searchTerm: string,
) {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limite', limit.toString());
  if (dataInicio) params.append('data_inicio', dataInicio);
  if (dataFim) params.append('data_fim', dataFim);
  if (localizacaoFilter) params.append('localizacao', localizacaoFilter);
  if (tipoFilter) params.append('tipo', tipoFilter);
  if (ordenar) params.append('ordenar', ordenar);
  if (searchTerm) params.append('item', searchTerm);
  return params;
}

export default function AbaMovimentacoes() {
  const { user } = useSession();
  const periodoPadrao = ultimosDias(30);
  const [dataInicio, setDataInicio] = useState(periodoPadrao.inicio);
  const [dataFim, setDataFim] = useState(periodoPadrao.fim);
  const [searchTerm, setSearchTerm] = useState('');
  const [localizacaoFilter, setLocalizacaoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [ordenar, setOrdenar] = useState('');
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
  } = useInfiniteQuery<MovimentacaoApiResponse>({
    queryKey: [
      'movimentacoes-relatorio',
      dataInicio,
      dataFim,
      localizacaoFilter,
      tipoFilter,
      ordenar,
      searchTerm,
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = buildParams(
        page,
        20,
        dataInicio,
        dataFim,
        localizacaoFilter,
        tipoFilter,
        ordenar,
        searchTerm,
      );
      return await get<MovimentacaoApiResponse>(
        `/movimentacoes?${params.toString()}`,
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

  const movimentacoes = data?.pages.flatMap((page) => page.data.docs) || [];

  const { data: resumo } = useQuery({
    queryKey: [
      'movimentacoes-relatorio-resumo',
      dataInicio,
      dataFim,
      localizacaoFilter,
      tipoFilter,
      searchTerm,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      if (localizacaoFilter) params.append('localizacao', localizacaoFilter);
      if (tipoFilter) params.append('tipo', tipoFilter);
      if (searchTerm) params.append('item', searchTerm);

      const response = await get<MovimentacaoResumoApiResponse>(
        `/movimentacoes/resumo?${params.toString()}`,
      );
      return (
        response?.data ?? {
          total_movimentacoes: 0,
          entradas: 0,
          saidas: 0,
          quantidade_entrada: 0,
          quantidade_saida: 0,
          saldo: 0,
        }
      );
    },
    staleTime: 30_000,
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
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectAll = () => {
    if (selectedItems.size === movimentacoes.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(movimentacoes.map((m) => m._id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const isAllSelected =
    movimentacoes.length > 0 && selectedItems.size === movimentacoes.length;
  const isSomeSelected =
    selectedItems.size > 0 && selectedItems.size < movimentacoes.length;

  const handleExport = async (fileName: string, format: string) => {
    try {
      const selecionadas = movimentacoes.filter((m) =>
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
      className="flex-1 overflow-hidden flex flex-col p-6 pt-4 max-w-full"
      data-test="relatorio-movimentacoes-page"
    >
      <div className="shrink-0 mb-6">
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
          data-test="stats-grid"
        >
          <StatCard
            title="Total de movimentações"
            value={resumo?.total_movimentacoes ?? 0}
            data-test="stat-total-movimentacoes"
          />
          <StatCard
            title="Entradas"
            value={resumo?.entradas ?? 0}
            data-test="stat-entradas"
          />
          <StatCard
            title="Saídas"
            value={resumo?.saidas ?? 0}
            data-test="stat-saidas"
          />
          <StatCard
            title="Saldo"
            value={resumo?.saldo ?? 0}
            valueColor={
              (resumo?.saldo ?? 0) < 0 ? 'var(--status-danger-text)' : undefined
            }
            data-test="stat-saldo"
            hoverTitle="Entradas menos saídas no período"
          />
        </div>
      </div>

      <div
        className="flex flex-nowrap items-center gap-3 mb-4 shrink-0"
        data-test="search-actions-bar"
      >
        <div
          className="relative flex-1 min-w-[120px]"
          data-test="search-container"
        >
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Pesquisar por item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 bg-background/30 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
            data-test="search-input"
          />
        </div>
        <FiltroPeriodo
          dataInicio={dataInicio}
          dataFim={dataFim}
          onChange={(inicio, fim) => {
            setDataInicio(inicio);
            setDataFim(fim);
          }}
          atalhos={[]}
          permitirLimpar
        />
        <FiltroLocalizacao
          value={localizacaoFilter}
          onChange={setLocalizacaoFilter}
          className="w-full sm:w-56 shrink-0"
        />
        <Select
          value={tipoFilter || 'todos'}
          onValueChange={(value) =>
            setTipoFilter(value === 'todos' ? '' : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-40 bg-background/30 dark:bg-input/30"
            data-test="filtro-tipo"
          >
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
          </SelectContent>
        </Select>
        <OrdenarPorSelect
          value={ordenar}
          onChange={setOrdenar}
          opcoes={ORDENACAO_MOVIMENTACOES}
        />
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

      {error && (
        <div
          className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0"
          data-test="error-message"
        >
          Erro ao carregar movimentações: {error.message}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-muted-foreground font-medium">
              Carregando movimentações...
            </p>
          </div>
        ) : movimentacoes.length > 0 ? (
          <div
            className="border border-border rounded-md bg-card flex-1 overflow-hidden flex flex-col"
            data-test="movimentacoes-table-container"
          >
            <div className="overflow-x-auto overflow-y-auto flex-1 relative">
              <table
                className="w-full min-w-[1050px] caption-bottom text-xs sm:text-sm"
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
                      className="font-semibold text-muted-foreground bg-muted text-center px-8"
                      data-test="table-head-data"
                    >
                      DATA/HORA
                    </TableHead>
                    <TableHead
                      className="font-semibold text-muted-foreground bg-muted text-center px-8"
                      data-test="table-head-tipo"
                    >
                      TIPO
                    </TableHead>
                    <TableHead
                      className="font-semibold text-muted-foreground bg-muted text-left px-8"
                      data-test="table-head-item"
                    >
                      ITEM
                    </TableHead>
                    <TableHead
                      className="font-semibold text-muted-foreground bg-muted text-center px-8"
                      data-test="table-head-quantidade"
                    >
                      QUANTIDADE
                    </TableHead>
                    <TableHead
                      className="font-semibold text-muted-foreground bg-muted text-center px-8"
                      data-test="table-head-localizacao"
                    >
                      LOCALIZAÇÃO
                    </TableHead>
                    <TableHead
                      className="font-semibold text-muted-foreground bg-muted text-left px-8"
                      data-test="table-head-responsavel"
                    >
                      RESPONSÁVEL
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((mov) => (
                    <TableRow
                      key={mov._id}
                      className="hover:bg-muted/35 border-b border-border cursor-pointer"
                      style={{ height: '60px' }}
                      data-test={`movimentacao-row-${mov._id}`}
                      onClick={() => handleSelectItem(mov._id)}
                    >
                      <TableCell
                        className="text-center px-8 py-3 align-middle"
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
                        className="text-center px-8 py-3 font-medium whitespace-nowrap"
                        data-test="movimentacao-data"
                      >
                        {new Date(mov.data_hora).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-center px-8 py-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium"
                          style={
                            mov.tipo === 'entrada'
                              ? {
                                  backgroundColor: 'var(--status-success-bg)',
                                  color: 'var(--status-success-text)',
                                }
                              : {
                                  backgroundColor: 'var(--status-danger-bg)',
                                  color: 'var(--status-danger-text)',
                                }
                          }
                          data-test={`badge-tipo-${mov.tipo}`}
                        >
                          {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </TableCell>
                      <TableCell
                        className="font-medium text-left px-8 py-3"
                        data-test="movimentacao-item"
                      >
                        <span
                          className="truncate block max-w-[220px]"
                          title={mov.item?.nome}
                        >
                          {mov.item?.nome || '-'}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-center px-8 py-3 font-medium"
                        data-test="movimentacao-quantidade"
                      >
                        {mov.quantidade}
                      </TableCell>
                      <TableCell
                        className="text-center px-8 py-3 font-medium"
                        data-test="movimentacao-localizacao"
                      >
                        <span
                          className="truncate inline-block max-w-[180px]"
                          title={mov.localizacao?.nome}
                        >
                          {mov.localizacao?.nome || '-'}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-left px-8 py-3"
                        data-test="movimentacao-responsavel"
                      >
                        <span
                          className="truncate block max-w-[180px]"
                          title={mov.usuario?.nome}
                        >
                          {mov.usuario?.nome || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>

              <div
                ref={observerTarget}
                className="h-10 flex items-center justify-center"
              >
                {isFetchingNextPage && (
                  <PulseLoader
                    color="var(--ei-accent)"
                    size={5}
                    speedMultiplier={0.8}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-card rounded-md border border-border">
            <EmptyState
              icon={ArrowRightLeft}
              title="Nenhuma movimentação encontrada"
              subtitle="Tente ajustar o período ou remover os filtros."
            />
          </div>
        )}
      </div>

      <ModalExportarRelatorio
        isOpen={isExportarModalOpen}
        onClose={() => setIsExportarModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}
