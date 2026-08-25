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
import ModalExcluirLocalizacao from '@/components/modal-excluir-localizacao';
import ModalCadastrarLocalizacao from '@/components/modal-cadastrar-localizacao';
import ModalEditarLocalizacao from '@/components/modal-editar-localizacao';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { LocalizacaoApiResponse } from '@/types/itens';
import { Search, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import { useState, useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

export default function PageLocalizacoesContent({
  initialData,
}: {
  initialData?: LocalizacaoApiResponse;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirLocalizacaoId, setExcluirLocalizacaoId] = useState<
    string | null
  >(null);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [editarLocalizacaoId, setEditarLocalizacaoId] = useState<string | null>(
    null,
  );
  const [atualizandoLocalizacaoId, setAtualizandoLocalizacaoId] = useState<
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
  } = useInfiniteQuery<LocalizacaoApiResponse>({
    queryKey: ['localizacoes', searchTerm],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      params.append('limite', '20');
      params.append('page', page.toString());

      const queryString = params.toString();
      const url = `/localizacoes${queryString ? `?${queryString}` : ''}`;

      return await get<LocalizacaoApiResponse>(url);
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
    if (!isFetching && atualizandoLocalizacaoId) {
      setAtualizandoLocalizacaoId(null);
    }
  }, [isFetching, atualizandoLocalizacaoId]);

  const handleAdicionarClick = () => {
    setIsCadastrarModalOpen(true);
  };

  const handleCadastrarSuccess = () => {
    refetch();
  };

  const handleEditarSuccess = () => {
    if (editarLocalizacaoId) {
      setAtualizandoLocalizacaoId(editarLocalizacaoId);
    }
    refetch();
  };

  const handleEdit = (id: string) => {
    setEditarLocalizacaoId(id);
    setIsEditarModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setExcluirLocalizacaoId(id);
    setIsExcluirModalOpen(true);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    toast.success('Localização excluída com sucesso!', {
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

  const localizacoes = data?.pages.flatMap((page) => page.data.docs) || [];

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="localizacoes-page"
    >
      <Cabecalho pagina="Localizações" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-1 max-w-full">
        <div
          className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar localizações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10"
              data-test="search-input"
            />
          </div>
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

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0">
            Erro ao carregar localizações: {error.message}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading || isRefetchingAfterDelete ? (
            <div
              className="flex flex-col items-center justify-center flex-1"
              data-test="loading-spinner"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando localizações...
              </p>
            </div>
          ) : localizacoes.length > 0 ? (
            <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  className="w-full min-w-[600px] caption-bottom text-xs sm:text-sm"
                  data-test="localizacoes-table"
                >
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8 whitespace-nowrap">
                        NOME
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-center px-8 w-full">
                        DESCRIÇÃO
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-center px-8 whitespace-nowrap">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localizacoes.map((localizacao, index) => (
                      <TableRow
                        key={localizacao._id}
                        data-test={`localizacao-row-${index}`}
                        className="hover:bg-muted border-b relative"
                        style={{ height: '60px' }}
                      >
                        {atualizandoLocalizacaoId === localizacao._id &&
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
                            title={localizacao.nome}
                          >
                            {localizacao.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2">
                          <span
                            className="truncate block max-w-[300px] mx-auto"
                            title={localizacao.descricao || '-'}
                          >
                            {localizacao.descricao || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(localizacao._id)}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-[var(--ei-accent)] hover:bg-[var(--ei-accent)]/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Editar localização"
                              data-test="edit-button"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(localizacao._id)}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir localização"
                              data-test="delete-button"
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
                icon={MapPin}
                title={
                  searchTerm
                    ? 'Nenhum resultado'
                    : 'Nenhuma localização cadastrada'
                }
                subtitle={
                  searchTerm
                    ? 'Tente ajustar sua pesquisa.'
                    : 'Comece adicionando a primeira localização.'
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

      {excluirLocalizacaoId && (
        <ModalExcluirLocalizacao
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setTimeout(() => setExcluirLocalizacaoId(null), 300);
          }}
          onSuccess={handleExcluirSuccess}
          localizacaoId={excluirLocalizacaoId}
          localizacaoNome={
            localizacoes.find((l) => l._id === excluirLocalizacaoId)?.nome || ''
          }
        />
      )}

      <ModalCadastrarLocalizacao
        isOpen={isCadastrarModalOpen}
        onClose={() => setIsCadastrarModalOpen(false)}
        onSuccess={handleCadastrarSuccess}
      />

      {editarLocalizacaoId && (
        <ModalEditarLocalizacao
          isOpen={isEditarModalOpen}
          onClose={() => {
            setIsEditarModalOpen(false);
            setTimeout(() => setEditarLocalizacaoId(null), 300);
          }}
          localizacaoId={editarLocalizacaoId}
          localizacaoNome={
            localizacoes.find((l) => l._id === editarLocalizacaoId)?.nome || ''
          }
          localizacaoDescricao={
            localizacoes.find((l) => l._id === editarLocalizacaoId)?.descricao
          }
          onSuccess={handleEditarSuccess}
        />
      )}
    </div>
  );
}
