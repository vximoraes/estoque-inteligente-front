'use client';
import Cabecalho from '@/components/cabecalho';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ModalExcluirOrcamento from '@/components/modal-excluir-orcamento';
import ModalDetalhesOrcamento from '@/components/modal-detalhes-orcamento';
import ModalFiltrosOrcamentos from '@/components/modal-filtros-orcamentos';
import ModalCadastrarOrcamento from '@/components/modal-cadastrar-orcamento';
import ModalEditarOrcamento from '@/components/modal-editar-orcamento';
import EmptyState from '@/components/empty-state';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { OrcamentoApiResponse } from '@/types/orcamentos';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

export default function PageOrcamentosContent({
  initialData,
}: {
  initialData?: OrcamentoApiResponse;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [valorMinFilter, setValorMinFilter] = useQueryState('valorMin', {
    defaultValue: '',
  });
  const [valorMaxFilter, setValorMaxFilter] = useQueryState('valorMax', {
    defaultValue: '',
  });
  const [dataInicioFilter, setDataInicioFilter] = useQueryState('dataInicio', {
    defaultValue: '',
  });
  const [dataFimFilter, setDataFimFilter] = useQueryState('dataFim', {
    defaultValue: '',
  });
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirOrcamentoId, setExcluirOrcamentoId] = useState<string | null>(
    null,
  );
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [detalhesOrcamentoId, setDetalhesOrcamentoId] = useState<string | null>(
    null,
  );
  const [detalhesOrcamentoNome, setDetalhesOrcamentoNome] =
    useState<string>('');
  const [detalhesOrcamentoDescricao, setDetalhesOrcamentoDescricao] = useState<
    string | undefined
  >(undefined);
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [editarOrcamentoId, setEditarOrcamentoId] = useState<string | null>(
    null,
  );

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<OrcamentoApiResponse>({
    queryKey: [
      'orcamentos',
      searchTerm,
      valorMinFilter,
      valorMaxFilter,
      dataInicioFilter,
      dataFimFilter,
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      if (valorMinFilter) params.append('valorMin', valorMinFilter);
      if (valorMaxFilter) params.append('valorMax', valorMaxFilter);
      if (dataInicioFilter) params.append('dataInicio', dataInicioFilter);
      if (dataFimFilter) params.append('dataFim', dataFimFilter);
      params.append('limite', '20');
      params.append('page', page.toString());

      const queryString = params.toString();
      const url = `/orcamentos${queryString ? `?${queryString}` : ''}`;

      return await get<OrcamentoApiResponse>(url);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: initialData
      ? { pages: [initialData], pageParams: [1] }
      : undefined,
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

  const handleAdicionarClick = () => {
    setIsCadastrarModalOpen(true);
  };

  const handleCloseCadastrarModal = () => {
    setIsCadastrarModalOpen(false);
  };

  const handleCadastrarSuccess = () => {
    toast.success('Orçamento criado com sucesso!', {
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

  const handleCloseEditarModal = () => {
    setIsEditarModalOpen(false);
    setTimeout(() => setEditarOrcamentoId(null), 300);
  };

  const handleEditarSuccess = () => {
    toast.success('Orçamento atualizado com sucesso!', {
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

  const hasActiveFilters =
    !!valorMinFilter ||
    !!valorMaxFilter ||
    !!dataInicioFilter ||
    !!dataFimFilter;

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const handleEdit = (id: string) => {
    setEditarOrcamentoId(id);
    setIsEditarModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setExcluirOrcamentoId(id);
    setIsExcluirModalOpen(true);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    toast.success('Orçamento excluído com sucesso!', {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      transition: Slide,
    });

    await refetch();
    setIsRefetchingAfterDelete(false);
  };

  const handleViewDetails = (id: string) => {
    const orcamento = orcamentos.find((o) => o._id === id);
    setDetalhesOrcamentoId(id);
    setDetalhesOrcamentoNome(orcamento?.nome || '');
    setDetalhesOrcamentoDescricao(orcamento?.descricao);
    setIsDetalhesModalOpen(true);
  };

  const handleExportarPDF = async (id: string) => {
    setPdfLoadingId(id);
    try {
      const response = await get<{ data: any }>(`/orcamentos/${id}`);
      const orcamento = response.data;

      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ORÇAMENTO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      doc.setFontSize(14);
      const splitNome = doc.splitTextToSize(
        orcamento.nome,
        pageWidth - 2 * margin,
      );
      doc.text(splitNome, margin, yPosition);
      yPosition += splitNome.length * 7 + 5;

      if (orcamento.descricao) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitDescription = doc.splitTextToSize(
          orcamento.descricao,
          pageWidth - 2 * margin,
        );
        doc.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 5 + 5;
      }

      yPosition += 5;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Itens:', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Nome', margin, yPosition);
      doc.text('Qtd', margin + 80, yPosition);
      doc.text('Valor Unit.', margin + 100, yPosition);
      doc.text('Subtotal', margin + 140, yPosition);
      yPosition += 2;

      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      orcamento.itens.forEach((comp: any) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        const nomeItem = doc.splitTextToSize(comp.nome || '-', 75);
        doc.text(nomeItem, margin, yPosition);
        doc.text(comp.quantidade.toString(), margin + 80, yPosition);
        doc.text(
          `R$ ${comp.valor_unitario.toFixed(2)}`,
          margin + 100,
          yPosition,
        );
        doc.text(`R$ ${comp.subtotal.toFixed(2)}`, margin + 140, yPosition);
        yPosition += Math.max(nomeItem.length * 5, 7);
      });

      yPosition += 5;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 7;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Total: R$ ${orcamento.total.toFixed(2)}`,
        margin + 100,
        yPosition,
      );

      yPosition = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' },
      );

      doc.save(`orcamento-${orcamento.nome.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);

      toast.success('PDF gerado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
    } finally {
      setPdfLoadingId(null);
    }
  };

  const orcamentos = data?.pages.flatMap((page) => page.data.docs) || [];

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="orcamentos-page"
    >
      <Cabecalho pagina="Orçamentos" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-1 max-w-full">
        <div
          className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar orçamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
              data-test="search-input"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer"
            onClick={handleOpenFiltrosModal}
            data-test="filtros-button"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </Button>
          <Button
            className="h-11 flex items-center gap-2 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            onClick={handleAdicionarClick}
            data-test="adicionar-button"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div className="flex flex-wrap items-center gap-2">
              {(valorMinFilter || valorMaxFilter) && (
                <div
                  className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted text-foreground rounded-md text-xs border border-border font-medium"
                  data-test="applied-filter-valor"
                >
                  <span className="font-medium">Valor:</span>
                  <span data-test="applied-filter-valor-valor">
                    {valorMinFilter ? `R$ ${valorMinFilter}` : 'R$ 0'} até{' '}
                    {valorMaxFilter ? `R$ ${valorMaxFilter}` : '∞'}
                  </span>
                  <button
                    onClick={() => {
                      setValorMinFilter('');
                      setValorMaxFilter('');
                    }}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de valor"
                    data-test="applied-filter-valor-remover"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {(dataInicioFilter || dataFimFilter) && (
                <div
                  className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted text-foreground rounded-md text-xs border border-border font-medium"
                  data-test="applied-filter-periodo"
                >
                  <span className="font-medium">Período:</span>
                  <span data-test="applied-filter-periodo-valor">
                    {dataInicioFilter ? formatarData(dataInicioFilter) : '...'}{' '}
                    até {dataFimFilter ? formatarData(dataFimFilter) : '...'}
                  </span>
                  <button
                    onClick={() => {
                      setDataInicioFilter('');
                      setDataFimFilter('');
                    }}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de período"
                    data-test="applied-filter-periodo-remover"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0">
            Erro ao carregar orçamentos: {error.message}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading || isRefetchingAfterDelete ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando orçamentos...
              </p>
            </div>
          ) : orcamentos.length > 0 ? (
            <div
              className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col"
              data-test="orcamentos-table"
            >
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[800px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        NOME
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        DESCRIÇÃO
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8 whitespace-nowrap">
                        TOTAL
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-center px-8 whitespace-nowrap">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentos.map((orcamento) => (
                      <TableRow
                        key={orcamento._id}
                        data-test="visualizar-button"
                        onClick={() => handleViewDetails(orcamento._id)}
                        className="hover:bg-muted border-b relative cursor-pointer"
                        style={{ height: '60px' }}
                      >
                        <TableCell className="font-medium text-left px-8 py-2">
                          <span
                            className="truncate block max-w-[150px]"
                            title={orcamento.nome}
                          >
                            {orcamento.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-left px-8 py-2">
                          <span
                            className="truncate block max-w-[250px]"
                            title={orcamento.descricao || '-'}
                          >
                            {orcamento.descricao || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-left px-8 py-2 whitespace-nowrap">
                          R$ {orcamento.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(orcamento._id);
                              }}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-[var(--ei-accent)] hover:bg-[var(--ei-accent)]/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Editar orçamento"
                              data-test="editar-button"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportarPDF(orcamento._id);
                              }}
                              disabled={pdfLoadingId === orcamento._id}
                              className={`p-1 sm:p-2 rounded-md transition-colors duration-200 ${
                                pdfLoadingId === orcamento._id
                                  ? 'text-muted-foreground cursor-wait'
                                  : 'text-muted-foreground hover:text-[var(--ei-accent)] hover:bg-[var(--ei-accent)]/10 cursor-pointer'
                              }`}
                              title={
                                pdfLoadingId === orcamento._id
                                  ? 'Gerando PDF...'
                                  : 'Exportar PDF'
                              }
                              data-test="exportar-pdf-button"
                            >
                              {pdfLoadingId === orcamento._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(orcamento._id);
                              }}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir orçamento"
                              data-test="excluir-button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                <div
                  ref={observerTarget}
                  className="h-10 flex items-center justify-center"
                  data-test="infinite-scroll-sentinel"
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
                icon={FileText}
                title={
                  searchTerm || hasActiveFilters
                    ? 'Nenhum resultado'
                    : 'Nenhum orçamento cadastrado'
                }
                subtitle={
                  searchTerm || hasActiveFilters
                    ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                    : 'Comece adicionando o primeiro orçamento.'
                }
              />
            </div>
          )}
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />

      <ModalFiltrosOrcamentos
        isOpen={isFiltrosModalOpen}
        onClose={handleCloseFiltrosModal}
        valorMinFilter={valorMinFilter}
        valorMaxFilter={valorMaxFilter}
        dataInicioFilter={dataInicioFilter}
        dataFimFilter={dataFimFilter}
        onFiltersChange={handleFiltersChange}
      />

      <ModalCadastrarOrcamento
        isOpen={isCadastrarModalOpen}
        onClose={handleCloseCadastrarModal}
        onSuccess={handleCadastrarSuccess}
      />

      {editarOrcamentoId && (
        <ModalEditarOrcamento
          isOpen={isEditarModalOpen}
          onClose={handleCloseEditarModal}
          orcamentoId={editarOrcamentoId}
          onSuccess={handleEditarSuccess}
        />
      )}

      {excluirOrcamentoId && (
        <ModalExcluirOrcamento
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setTimeout(() => setExcluirOrcamentoId(null), 300);
          }}
          onSuccess={handleExcluirSuccess}
          orcamentoId={excluirOrcamentoId}
          orcamentoNome={
            orcamentos.find((o) => o._id === excluirOrcamentoId)?.nome || ''
          }
        />
      )}

      {detalhesOrcamentoId && (
        <ModalDetalhesOrcamento
          isOpen={isDetalhesModalOpen}
          onClose={() => {
            setIsDetalhesModalOpen(false);
            setTimeout(() => {
              setDetalhesOrcamentoId(null);
              setDetalhesOrcamentoNome('');
              setDetalhesOrcamentoDescricao(undefined);
            }, 300);
          }}
          orcamentoId={detalhesOrcamentoId}
          orcamentoNome={detalhesOrcamentoNome}
          orcamentoDescricao={detalhesOrcamentoDescricao}
        />
      )}
    </div>
  );
}
