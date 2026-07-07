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
import ModalExcluirFornecedor from '@/components/modal-excluir-fornecedor';
import ModalDetalhesFornecedor from '@/components/modal-detalhes-fornecedor';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { FornecedorApiResponse } from '@/types/fornecedores';
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PageFornecedoresContent({ initialData }: { initialData?: FornecedorApiResponse }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useQueryState('busca', { defaultValue: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirFornecedorId, setExcluirFornecedorId] = useState<string | null>(
    null,
  );
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [detalhesFornecedorId, setDetalhesFornecedorId] = useState<
    string | null
  >(null);
  const [atualizandoFornecedorId, setAtualizandoFornecedorId] = useState<
    string | null
  >(null);
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<FornecedorApiResponse>({
    queryKey: ['fornecedores', searchTerm, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      params.append('limite', '20');
      params.append('page', currentPage.toString());

      const queryString = params.toString();
      const url = `/fornecedores${queryString ? `?${queryString}` : ''}`;

      return await get<FornecedorApiResponse>(url);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: initialData,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const success = searchParams.get('success');
    const fornecedorId = searchParams.get('id');

    if (success === 'created') {
      if (fornecedorId) {
        setAtualizandoFornecedorId(fornecedorId);
      }
      toast.success('Fornecedor criado com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
      refetch();
      router.replace('/fornecedores');
    } else if (success === 'updated') {
      if (fornecedorId) {
        setAtualizandoFornecedorId(fornecedorId);
      }
      toast.success('Fornecedor atualizado com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
      refetch();
      router.replace('/fornecedores');
    }
  }, [searchParams, router, refetch]);

  useEffect(() => {
    if (!isFetching && atualizandoFornecedorId) {
      setAtualizandoFornecedorId(null);
    }
  }, [isFetching, atualizandoFornecedorId]);

  const handleAdicionarClick = () => {
    router.push('/fornecedores/adicionar');
  };

  const handleEdit = (id: string) => {
    router.push(`/fornecedores/editar/${id}`);
  };

  const handleDelete = (id: string) => {
    setExcluirFornecedorId(id);
    setIsExcluirModalOpen(true);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    toast.success('Fornecedor excluído com sucesso!', {
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
    setDetalhesFornecedorId(id);
    setIsDetalhesModalOpen(true);
  };

  const fornecedores = data?.data?.docs || [];
  const paginationInfo = data?.data || {
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      <Cabecalho pagina="Fornecedores" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        <div
          className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            className="flex items-center gap-2 text-white hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#306FCC' }}
            onClick={handleAdicionarClick}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded shrink-0">
            Erro ao carregar fornecedores: {error.message}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading || isRefetchingAfterDelete ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Carregando fornecedores...
              </p>
            </div>
          ) : fornecedores.length > 0 ? (
            <div className="border rounded-lg bg-white flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[900px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        NOME
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        URL
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        CONTATO
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        DESCRIÇÃO
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-center px-8 whitespace-nowrap">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.map((fornecedor) => (
                      <TableRow
                        key={fornecedor._id}
                        className="hover:bg-gray-50 border-b relative"
                        style={{ height: '60px' }}
                      >
                        {atualizandoFornecedorId === fornecedor._id &&
                          isFetching && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                              <div className="flex flex-col items-center">
                                <div className="relative w-8 h-8">
                                  <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
                                </div>
                                <p className="mt-2 text-sm text-gray-600">
                                  Atualizando...
                                </p>
                              </div>
                            </div>
                          )}
                        <TableCell className="font-medium text-left px-8 py-2">
                          <span
                            className="truncate block max-w-[200px]"
                            title={fornecedor.nome}
                          >
                            {fornecedor.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-left px-8 py-2">
                          {fornecedor.url ? (
                            <a
                              href={fornecedor.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[200px]"
                              title={fornecedor.url}
                            >
                              {fornecedor.url}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-left px-8 py-2">
                          <span
                            className="truncate block max-w-[150px]"
                            title={fornecedor.contato || '-'}
                          >
                            {fornecedor.contato || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-left px-8 py-2">
                          <span
                            className="truncate block max-w-[200px]"
                            title={fornecedor.descricao || '-'}
                          >
                            {fornecedor.descricao || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleViewDetails(fornecedor._id)}
                              className="p-1 sm:p-2 text-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Ver detalhes do fornecedor"
                            >
                              <Eye size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(fornecedor._id)}
                              className="p-1 sm:p-2 text-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Editar fornecedor"
                            >
                              <Edit size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(fornecedor._id)}
                              className="p-1 sm:p-2 text-gray-900 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir fornecedor"
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
            <div className="text-center flex-1 flex items-center justify-center bg-white rounded-lg border">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? 'Nenhum fornecedor encontrado para sua pesquisa.'
                    : 'Não há fornecedores cadastrados...'}
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

      {excluirFornecedorId && (
        <ModalExcluirFornecedor
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setExcluirFornecedorId(null);
          }}
          onSuccess={handleExcluirSuccess}
          fornecedorId={excluirFornecedorId}
          fornecedorNome={
            fornecedores.find((f) => f._id === excluirFornecedorId)?.nome || ''
          }
        />
      )}

      {detalhesFornecedorId && (
        <ModalDetalhesFornecedor
          isOpen={isDetalhesModalOpen}
          onClose={() => {
            setIsDetalhesModalOpen(false);
            setDetalhesFornecedorId(null);
          }}
          fornecedorId={detalhesFornecedorId}
        />
      )}
    </div>
  );
}
