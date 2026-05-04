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
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { OrcamentoApiResponse } from '@/types/orcamentos';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PageOrcamentosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useQueryState('busca', { defaultValue: '' });
  const [currentPage, setCurrentPage] = useState(1);
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

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<OrcamentoApiResponse>({
    queryKey: ['orcamentos', searchTerm, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      params.append('limite', '20');
      params.append('page', currentPage.toString());

      const queryString = params.toString();
      const url = `/orcamentos${queryString ? `?${queryString}` : ''}`;

      return await get<OrcamentoApiResponse>(url);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const success = searchParams.get('success');

    if (success === 'created') {
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
      router.replace('/orcamentos');
    } else if (success === 'updated') {
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
      router.replace('/orcamentos');
    }
  }, [searchParams, router, refetch]);

  const handleAdicionarClick = () => {
    router.push('/orcamentos/adicionar');
  };

  const handleEdit = (id: string) => {
    router.push(`/orcamentos/editar/${id}`);
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

  const orcamentos = data?.data?.docs || [];
  const paginationInfo = data?.data || {
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="orcamentos-page"
    >
      <Cabecalho pagina="Orçamentos" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        {/* Barra de Pesquisa e Botão Adicionar */}
        <div
          className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar orçamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
              data-test="search-input"
            />
          </div>
          <Button
            className="flex items-center gap-2 text-white hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#306FCC' }}
            onClick={handleAdicionarClick}
            data-test="adicionar-button"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded shrink-0">
            Erro ao carregar orçamentos: {error.message}
          </div>
        )}

        {/* Área da Tabela */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ||
          isRefetchingAfterDelete ||
          (isFetching && !isLoading) ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Carregando orçamentos...
              </p>
            </div>
          ) : orcamentos.length > 0 ? (
            <div
              className="border rounded-lg bg-white flex-1 overflow-hidden flex flex-col"
              data-test="orcamentos-table"
            >
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[800px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        NOME
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        DESCRIÇÃO
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8 whitespace-nowrap">
                        TOTAL
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-center px-8 whitespace-nowrap">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentos.map((orcamento) => (
                      <TableRow
                        key={orcamento._id}
                        className="hover:bg-gray-50 border-b relative"
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
                              onClick={() => handleViewDetails(orcamento._id)}
                              className="p-1 sm:p-2 text-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Ver detalhes do orçamento"
                              data-test="visualizar-button"
                            >
                              <Eye size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(orcamento._id)}
                              className="p-1 sm:p-2 text-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Editar orçamento"
                              data-test="editar-button"
                            >
                              <Edit size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={() => handleExportarPDF(orcamento._id)}
                              disabled={pdfLoadingId === orcamento._id}
                              className={`p-1 sm:p-2 rounded-md transition-colors duration-200 ${
                                pdfLoadingId === orcamento._id
                                  ? 'text-gray-400 cursor-wait'
                                  : 'text-gray-900 hover:text-green-600 hover:bg-green-50 cursor-pointer'
                              }`}
                              title={
                                pdfLoadingId === orcamento._id
                                  ? 'Gerando PDF...'
                                  : 'Exportar PDF'
                              }
                              data-test="exportar-pdf-button"
                            >
                              {pdfLoadingId === orcamento._id ? (
                                <Loader2
                                  size={16}
                                  className="sm:w-5 sm:h-5 animate-spin"
                                />
                              ) : (
                                <FileDown size={16} className="sm:w-5 sm:h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(orcamento._id)}
                              className="p-1 sm:p-2 text-gray-900 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir orçamento"
                              data-test="excluir-button"
                            >
                              <Trash2 size={16} className="sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

              </div>
              {paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 shrink-0">
                  <p className="text-sm text-gray-600">
                    Página {paginationInfo.page} de {paginationInfo.totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={!paginationInfo.hasPrevPage || isFetching}
                      className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={!paginationInfo.hasNextPage || isFetching}
                      className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="text-center flex-1 flex items-center justify-center bg-white rounded-lg border"
              data-test="empty-state"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
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

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />

      {/* Modal Excluir Orçamento */}
      {excluirOrcamentoId && (
        <ModalExcluirOrcamento
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setExcluirOrcamentoId(null);
          }}
          onSuccess={handleExcluirSuccess}
          orcamentoId={excluirOrcamentoId}
          orcamentoNome={
            orcamentos.find((o) => o._id === excluirOrcamentoId)?.nome || ''
          }
        />
      )}

      {/* Modal Detalhes Orçamento */}
      {detalhesOrcamentoId && (
        <ModalDetalhesOrcamento
          isOpen={isDetalhesModalOpen}
          onClose={() => {
            setIsDetalhesModalOpen(false);
            setDetalhesOrcamentoId(null);
            setDetalhesOrcamentoNome('');
            setDetalhesOrcamentoDescricao(undefined);
          }}
          orcamentoId={detalhesOrcamentoId}
          orcamentoNome={detalhesOrcamentoNome}
          orcamentoDescricao={detalhesOrcamentoDescricao}
        />
      )}
    </div>
  );
}

export default function PageOrcamentos() {
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
      <PageOrcamentosContent />
    </Suspense>
  );
}
