'use client';
import StatCard from '@/components/stat-card';
import Cabecalho from '@/components/cabecalho';
import ModalExportarRelatorio from '@/components/modal-exportar-relatorio';
import ModalFiltrosOrcamentos from '@/components/modal-filtros-orcamentos';
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
import { OrcamentoApiResponse } from '@/types/orcamentos';
import {
  Search,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PulseLoader } from 'react-spinners';
import { generateOrcamentosPDF } from '@/utils/pdfGenerator';
import { generateOrcamentosCSV } from '@/utils/csvGenerator';
import { toast, Slide } from 'react-toastify';
import { useSession } from '@/hooks/use-session';

function RelatorioOrcamentosPageContent() {
  const router = useRouter();
  const { user } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isExportarModalOpen, setIsExportarModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Buscar orçamentos com infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<OrcamentoApiResponse>({
    queryKey: ['orcamentos-relatorio', searchTerm],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('limit', '20'); // 20 itens por página
      params.append('page', page.toString());

      const queryString = params.toString();
      const url = `/orcamentos${queryString ? `?${queryString}` : ''}`;

      return await get<OrcamentoApiResponse>(url);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: 'always',
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Intersection Observer para infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const todosOrcamentos = data?.pages.flatMap((page) => page.data.docs) || [];

  // Filtrar orçamentos localmente baseado no searchTerm e ordenar por nome
  const orcamentosFiltrados = todosOrcamentos
    .filter((orcamento) => {
      // Validar se o orçamento tem os campos necessários
      if (!orcamento?.nome) {
        return false;
      }

      const matchSearch =
        !searchTerm ||
        orcamento.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orcamento._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orcamento.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por valor mínimo
      const matchValorMin =
        !valorMinFilter || orcamento.total >= parseFloat(valorMinFilter);

      // Filtro por valor máximo
      const matchValorMax =
        !valorMaxFilter || orcamento.total <= parseFloat(valorMaxFilter);

      // Filtro por data de início (adiciona T00:00:00 para garantir comparação no fuso local)
      const matchDataInicio =
        !dataInicioFilter ||
        (orcamento.createdAt &&
          new Date(orcamento.createdAt) >=
            new Date(dataInicioFilter + 'T00:00:00'));

      // Filtro por data de fim (adiciona T23:59:59 para incluir todo o dia)
      const matchDataFim =
        !dataFimFilter ||
        (orcamento.createdAt &&
          new Date(orcamento.createdAt) <=
            new Date(dataFimFilter + 'T23:59:59'));

      return (
        matchSearch &&
        matchValorMin &&
        matchValorMax &&
        matchDataInicio &&
        matchDataFim
      );
    })
    .sort((a, b) => {
      // Ordenar alfabeticamente pelo nome do orçamento
      const nomeA = a.nome?.toLowerCase() || '';
      const nomeB = b.nome?.toLowerCase() || '';
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

  // Calcular estatísticas baseadas nos orçamentos filtrados
  const totalOrcamentos = orcamentosFiltrados.length;
  const valorTotal = orcamentosFiltrados.reduce(
    (acc, orc) => acc + (orc.total || 0),
    0,
  );
  const valorMedio = totalOrcamentos > 0 ? valorTotal / totalOrcamentos : 0;
  const maiorOrcamento =
    totalOrcamentos > 0
      ? Math.max(...orcamentosFiltrados.map((orc) => orc.total || 0))
      : 0;
  const menorOrcamento =
    totalOrcamentos > 0
      ? Math.min(...orcamentosFiltrados.map((orc) => orc.total || 0))
      : 0;
  const totalItens = orcamentosFiltrados.reduce(
    (acc, orc) => acc + (orc.itens?.length || 0),
    0,
  );

  const handleOpenFiltrosModal = () => {
    setIsFiltrosModalOpen(true);
  };

  const handleCloseFiltrosModal = () => {
    setIsFiltrosModalOpen(false);
  };

  const handleFiltersChange = (
    valorMin: string,
    valorMax: string,
    dataInicio: string,
    dataFim: string,
  ) => {
    setValorMinFilter(valorMin);
    setValorMaxFilter(valorMax);
    setDataInicioFilter(dataInicio);
    setDataFimFilter(dataFim);
  };

  const handleOpenExportarModal = () => {
    setIsExportarModalOpen(true);
  };

  const handleCloseExportarModal = () => {
    setIsExportarModalOpen(false);
  };

  const handleExport = async (fileName: string, format: string) => {
    try {
      // Filtrar apenas os orçamentos selecionados
      const orcamentosSelecionados = orcamentosFiltrados.filter((orcamento) =>
        selectedItems.has(orcamento._id),
      );

      if (format === 'PDF') {
        // Gerar PDF
        await generateOrcamentosPDF({
          orcamentos: orcamentosSelecionados,
          fileName: fileName.trim(),
          title: 'RELATÓRIO DE ORÇAMENTOS',
          includeStats: true,
          userName: user?.name || 'Usuário',
        });

        toast.success(
          `PDF gerado com sucesso! ${orcamentosSelecionados.length} orçamento(s) exportado(s).`,
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
        generateOrcamentosCSV({
          orcamentos: orcamentosSelecionados,
          fileName: fileName.trim(),
          includeStats: true,
        });

        toast.success(
          `CSV gerado com sucesso! ${orcamentosSelecionados.length} orçamento(s) exportado(s).`,
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
    if (selectedItems.size === orcamentosFiltrados.length) {
      // Se todos estão selecionados, desmarcar todos
      setSelectedItems(new Set());
    } else {
      // Selecionar todos os itens filtrados
      const allIds = new Set(orcamentosFiltrados.map((orc) => orc._id));
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
    orcamentosFiltrados.length > 0 &&
    selectedItems.size === orcamentosFiltrados.length;
  const isSomeSelected =
    selectedItems.size > 0 && selectedItems.size < orcamentosFiltrados.length;

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="relatorio-orcamentos-page"
    >
      <Cabecalho pagina="Relatórios" acao="Orçamentos" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        {/* Stats Cards - Colapsável no mobile */}
        <div className="shrink-0 mb-6">
          {/* Botão para mobile */}
          <button
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="xl:hidden w-full flex items-center justify-between px-4 py-2 bg-card rounded-lg border border-border hover:bg-muted/40 transition-colors h-10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#306FCC]" />
              <span className="font-semibold text-foreground">Estatísticas</span>
            </div>
            {isStatsOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {/* Cards - Sempre visível no desktop, colapsável no mobile */}
          <div
            className={`${isStatsOpen ? 'flex mt-4' : 'hidden'} xl:flex xl:mt-0 flex-col sm:flex-row gap-3`}
            data-test="stats-grid"
          >
            <StatCard
              title="Total de orçamentos"
              value={totalOrcamentos}
              data-test="stat-total-orcamentos"
              hoverTitle={`Total de orçamentos cadastrados: ${totalOrcamentos}`}
            />
            <StatCard
              title="Valor total"
              value={`R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              data-test="stat-valor-total"
              hoverTitle={`Soma de todos os orçamentos: R$ ${valorTotal.toFixed(2)}`}
            />
            <StatCard
              title="Maior orçamento"
              value={`R$ ${maiorOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              data-test="stat-maior-orcamento"
              hoverTitle={`Maior valor de orçamento: R$ ${maiorOrcamento.toFixed(2)}`}
            />
            <StatCard
              title="Menor orçamento"
              value={`R$ ${menorOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              data-test="stat-menor-orcamento"
              hoverTitle={`Menor valor de orçamento: R$ ${menorOrcamento.toFixed(2)}`}
            />
          </div>
        </div>

        {/* Barra de Pesquisa e Botões */}
        <div
          className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar orçamentos..."
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
            title={
              selectedItems.size === 0
                ? 'Selecione orçamentos para exportar'
                : `Exportar ${selectedItems.size} orçamento(s)`
            }
          >
            <img src="../gerar-pdf.svg" alt="" className="w-5" />
            Exportar
          </Button>
        </div>

        {/* Filtros aplicados */}
        {(valorMinFilter ||
          valorMaxFilter ||
          dataInicioFilter ||
          dataFimFilter) && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div
              className="flex flex-wrap items-center gap-2"
              data-test="filters-container"
            >
              {valorMinFilter && (
                <div
                  data-test="filter-tag-valor-min"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                >
                  <span className="font-medium">Valor mín:</span>
                  <span>
                    R${' '}
                    {parseFloat(valorMinFilter).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <button
                    onClick={() => setValorMinFilter('')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de valor mínimo"
                    data-test="remove-valor-min-filter"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {valorMaxFilter && (
                <div
                  data-test="filter-tag-valor-max"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                >
                  <span className="font-medium">Valor máx:</span>
                  <span>
                    R${' '}
                    {parseFloat(valorMaxFilter).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <button
                    onClick={() => setValorMaxFilter('')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de valor máximo"
                    data-test="remove-valor-max-filter"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {dataInicioFilter && (
                <div
                  data-test="filter-tag-data-inicio"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                >
                  <span className="font-medium">De:</span>
                  <span>
                    {new Date(
                      dataInicioFilter + 'T00:00:00',
                    ).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    onClick={() => setDataInicioFilter('')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de data inicial"
                    data-test="remove-data-inicio-filter"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {dataFimFilter && (
                <div
                  data-test="filter-tag-data-fim"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                >
                  <span className="font-medium">Até:</span>
                  <span>
                    {new Date(dataFimFilter + 'T00:00:00').toLocaleDateString(
                      'pt-BR',
                    )}
                  </span>
                  <button
                    onClick={() => setDataFimFilter('')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de data final"
                    data-test="remove-data-fim-filter"
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
            className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded shrink-0"
            data-test="error-message"
            title={`Erro completo: ${error.message}`}
          >
            Erro ao carregar orçamentos: {error.message}
          </div>
        )}

        {/* Área da Tabela com Scroll */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center flex-1"
              data-test="loading-spinner"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#306FCC]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#306FCC] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando orçamentos...
              </p>
            </div>
          ) : orcamentosFiltrados.length > 0 ? (
            <div className="border border-border rounded-lg bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[1000px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b border-border">
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
                        data-test="table-head-nome"
                      >
                        NOME
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-left px-8"
                        data-test="table-head-descricao"
                      >
                        DESCRIÇÃO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-itens"
                      >
                        ITENS
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-valor-total"
                      >
                        VALOR TOTAL
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-data"
                      >
                        DATA
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentosFiltrados.map((orcamento) => (
                      <TableRow
                        data-test="orcamento-row"
                        key={orcamento._id}
                        className="hover:bg-muted/35 border-b border-border"
                        style={{ height: '60px' }}
                      >
                        <TableCell className="text-center px-8 py-3 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(orcamento._id)}
                            onChange={() => handleSelectItem(orcamento._id)}
                            className="w-4 h-4 cursor-pointer"
                            data-test="checkbox-select-item"
                          />
                        </TableCell>
                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="orcamento-codigo"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={orcamento._id}
                          >
                            {orcamento._id.slice(-8)}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-left px-8 py-3"
                          data-test="orcamento-nome"
                        >
                          <span
                            className="truncate block max-w-[200px] font-medium"
                            title={orcamento.nome}
                          >
                            {orcamento.nome}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-left px-8 py-3"
                          data-test="orcamento-descricao"
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={orcamento.descricao || '-'}
                          >
                            {orcamento.descricao || '-'}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-center px-8 py-3 font-medium"
                          data-test="orcamento-itens"
                        >
                          {orcamento.itens?.length || 0}
                        </TableCell>
                        <TableCell
                          className="text-center px-8 py-3 font-medium text-foreground whitespace-nowrap"
                          data-test="orcamento-valor-total"
                        >
                          R${' '}
                          {orcamento.total.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell
                          className="text-center px-8 py-3 font-medium whitespace-nowrap"
                          data-test="orcamento-data"
                        >
                          <span
                            className="truncate block max-w-[150px]"
                            title={
                              orcamento.createdAt
                                ? new Date(orcamento.createdAt).toLocaleString(
                                    'pt-BR',
                                  )
                                : '-'
                            }
                          >
                            {orcamento.createdAt
                              ? new Date(
                                  orcamento.createdAt,
                                ).toLocaleDateString('pt-BR')
                              : '-'}
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
            <div
              className="text-center flex-1 flex items-center justify-center bg-card rounded-lg border border-border"
              data-test="empty-state"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-base">
                  {searchTerm
                    ? 'Nenhum orçamento encontrado para sua pesquisa.'
                    : 'Não há orçamentos cadastrados...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Filtros */}
      <ModalFiltrosOrcamentos
        isOpen={isFiltrosModalOpen}
        onClose={handleCloseFiltrosModal}
        valorMinFilter={valorMinFilter}
        valorMaxFilter={valorMaxFilter}
        dataInicioFilter={dataInicioFilter}
        dataFimFilter={dataFimFilter}
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

export default function RelatorioOrcamentosPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-[#306FCC]/15"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#306FCC] border-r-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground font-medium">Carregando...</p>
        </div>
      }
    >
      <RelatorioOrcamentosPageContent />
    </Suspense>
  );
}
