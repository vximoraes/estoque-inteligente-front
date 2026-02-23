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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronDown,
  ChevronUp,
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
            className="xl:hidden w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors h-10 cursor-pointer"
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

          {/* Cards - Sempre visível no desktop, colapsável no mobile */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isStatsOpen ? 'block mt-4' : 'hidden'} xl:grid xl:mt-0`}
            data-test="stats-grid"
          >
            <StatCard
              title="Total de"
              subtitle="orçamentos"
              value={totalOrcamentos}
              icon={FileText}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              data-test="stat-total-orcamentos"
              hoverTitle={`Total de orçamentos cadastrados: ${totalOrcamentos}`}
            />

            <div
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 w-full h-full min-h-[120px] flex items-center"
              data-test="stat-valor-total"
              title={`Soma de todos os orçamentos: R$ ${valorTotal.toFixed(2)}`}
            >
              <div className="flex items-center w-full">
                <div className="p-2 bg-green-100 rounded-lg shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Valor total
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R${' '}
                    {valorTotal.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 w-full h-full min-h-[120px] flex items-center"
              data-test="stat-maior-orcamento"
              title={`Maior valor de orçamento: R$ ${maiorOrcamento.toFixed(2)}`}
            >
              <div className="flex items-center w-full">
                <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Maior orçamento
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R${' '}
                    {maiorOrcamento.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 w-full h-full min-h-[120px] flex items-center"
              data-test="stat-menor-orcamento"
              title={`Menor valor de orçamento: R$ ${menorOrcamento.toFixed(2)}`}
            >
              <div className="flex items-center w-full">
                <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                  <TrendingDown className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Menor orçamento
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R${' '}
                    {menorOrcamento.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Pesquisa e Botões */}
        <div
          className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm"
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
                    className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de valor mínimo"
                    data-test="remove-valor-min-filter"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              )}
              {valorMaxFilter && (
                <div
                  data-test="filter-tag-valor-max"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm"
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
                    className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de valor máximo"
                    data-test="remove-valor-max-filter"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              )}
              {dataInicioFilter && (
                <div
                  data-test="filter-tag-data-inicio"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm"
                >
                  <span className="font-medium">De:</span>
                  <span>
                    {new Date(
                      dataInicioFilter + 'T00:00:00',
                    ).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    onClick={() => setDataInicioFilter('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de data inicial"
                    data-test="remove-data-inicio-filter"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              )}
              {dataFimFilter && (
                <div
                  data-test="filter-tag-data-fim"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-300 shadow-sm"
                >
                  <span className="font-medium">Até:</span>
                  <span>
                    {new Date(dataFimFilter + 'T00:00:00').toLocaleDateString(
                      'pt-BR',
                    )}
                  </span>
                  <button
                    onClick={() => setDataFimFilter('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remover filtro de data final"
                    data-test="remove-data-fim-filter"
                  >
                    <span className="text-xs">✕</span>
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
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Carregando orçamentos...
              </p>
            </div>
          ) : orcamentosFiltrados.length > 0 ? (
            <div className="border rounded-lg bg-white flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[1000px] caption-bottom text-xs sm:text-sm">
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
                        className="font-semibold text-gray-700 bg-gray-50 text-left px-8"
                        data-test="table-head-codigo"
                      >
                        CÓDIGO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-left px-8"
                        data-test="table-head-nome"
                      >
                        NOME
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-left px-8"
                        data-test="table-head-descricao"
                      >
                        DESCRIÇÃO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-center px-8"
                        data-test="table-head-itens"
                      >
                        ITENS
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-center px-8"
                        data-test="table-head-valor-total"
                      >
                        VALOR TOTAL
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 bg-gray-50 text-center px-8"
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
                        className="hover:bg-gray-50 border-b"
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
                          className="text-center px-8 py-3 font-medium text-green-700 whitespace-nowrap"
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
              className="text-center flex-1 flex items-center justify-center bg-white rounded-lg border"
              data-test="empty-state"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">
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
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Carregando...</p>
        </div>
      }
    >
      <RelatorioOrcamentosPageContent />
    </Suspense>
  );
}
