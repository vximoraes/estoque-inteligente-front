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
import ModalCadastrarFornecedor from '@/components/modal-cadastrar-fornecedor';
import ModalEditarFornecedor from '@/components/modal-editar-fornecedor';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { FornecedorApiResponse } from '@/types/fornecedores';
import { Search, Truck, Plus, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import { useState, useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

export default function PageFornecedoresContent({
  initialData,
}: {
  initialData?: FornecedorApiResponse;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirFornecedorId, setExcluirFornecedorId] = useState<string | null>(
    null,
  );
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [detalhesFornecedorId, setDetalhesFornecedorId] = useState<
    string | null
  >(null);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [editarFornecedorId, setEditarFornecedorId] = useState<string | null>(
    null,
  );
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FornecedorApiResponse>({
    queryKey: ['fornecedores', searchTerm],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      params.append('limite', '20');
      params.append('page', page.toString());

      const queryString = params.toString();
      const url = `/fornecedores${queryString ? `?${queryString}` : ''}`;

      return await get<FornecedorApiResponse>(url);
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

  useEffect(() => {
    if (!isFetching && atualizandoFornecedorId) {
      setAtualizandoFornecedorId(null);
    }
  }, [isFetching, atualizandoFornecedorId]);

  const handleAdicionarClick = () => {
    setIsCadastrarModalOpen(true);
  };

  const handleCadastrarSuccess = () => {
    refetch();
  };

  const handleEditarSuccess = () => {
    if (editarFornecedorId) {
      setAtualizandoFornecedorId(editarFornecedorId);
    }
    refetch();
  };

  const handleEdit = (id: string) => {
    setEditarFornecedorId(id);
    setIsEditarModalOpen(true);
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

  const fornecedores = data?.pages.flatMap((page) => page.data.docs) || [];

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      <Cabecalho pagina="Fornecedores" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        <div
          className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <Button
            className="h-11 flex items-center gap-2 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            onClick={handleAdicionarClick}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0">
            Erro ao carregar fornecedores: {error.message}
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
                Carregando fornecedores...
              </p>
            </div>
          ) : fornecedores.length > 0 ? (
            <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[900px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        NOME
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        URL
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        CONTATO
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        DESCRIÇÃO
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-center px-8 whitespace-nowrap">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.map((fornecedor) => (
                      <TableRow
                        key={fornecedor._id}
                        onClick={() => handleViewDetails(fornecedor._id)}
                        className="hover:bg-muted border-b relative cursor-pointer"
                        style={{ height: '60px' }}
                      >
                        {atualizandoFornecedorId === fornecedor._id &&
                          isFetching && (
                            <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center z-10">
                              <div className="flex flex-col items-center">
                                <div className="relative w-8 h-8">
                                  <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                                  <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
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
                              onClick={(e) => e.stopPropagation()}
                              className="text-ei-accent hover:text-ei-accent-hover hover:underline truncate block max-w-[200px]"
                              title={fornecedor.url}
                            >
                              {fornecedor.url}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(fornecedor._id);
                              }}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-[var(--ei-accent)] hover:bg-[var(--ei-accent)]/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Editar fornecedor"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(fornecedor._id);
                              }}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir fornecedor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                icon={Truck}
                title={
                  searchTerm
                    ? 'Nenhum resultado'
                    : 'Nenhum fornecedor cadastrado'
                }
                subtitle={
                  searchTerm
                    ? 'Tente ajustar sua pesquisa.'
                    : 'Comece adicionando o primeiro fornecedor.'
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

      {excluirFornecedorId && (
        <ModalExcluirFornecedor
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setTimeout(() => setExcluirFornecedorId(null), 300);
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
            setTimeout(() => setDetalhesFornecedorId(null), 300);
          }}
          fornecedorId={detalhesFornecedorId}
        />
      )}

      <ModalCadastrarFornecedor
        isOpen={isCadastrarModalOpen}
        onClose={() => setIsCadastrarModalOpen(false)}
        onSuccess={handleCadastrarSuccess}
      />

      {editarFornecedorId && (
        <ModalEditarFornecedor
          isOpen={isEditarModalOpen}
          onClose={() => {
            setIsEditarModalOpen(false);
            setTimeout(() => setEditarFornecedorId(null), 300);
          }}
          fornecedorId={editarFornecedorId}
          onSuccess={handleEditarSuccess}
        />
      )}
    </div>
  );
}
