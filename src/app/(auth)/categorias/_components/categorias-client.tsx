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
import ModalExcluirCategoria from '@/components/modal-excluir-categoria';
import ModalCadastrarCategoria from '@/components/modal-cadastrar-categoria';
import ModalEditarCategoria from '@/components/modal-editar-categoria';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { CategoriaApiResponse } from '@/types/categorias';
import { ITEM_TIPO_LABEL_CURTO, type ItemTipo } from '@/types/itens';
import { Search, Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import { useState, useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

export default function PageCategoriasContent({
  initialData,
}: {
  initialData?: CategoriaApiResponse;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const [tipoRaw, setTipo] = useQueryState('tipo', { defaultValue: 'consumo' });
  const tipo: ItemTipo = tipoRaw === 'permanente' ? 'permanente' : 'consumo';
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirCategoriaId, setExcluirCategoriaId] = useState<string | null>(
    null,
  );
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [editarCategoriaId, setEditarCategoriaId] = useState<string | null>(
    null,
  );
  const [atualizandoCategoriaId, setAtualizandoCategoriaId] = useState<
    string | null
  >(null);
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] =
    useState(false);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<CategoriaApiResponse>({
    queryKey: ['categorias', tipo, searchTerm],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('tipo', tipo);
      if (searchTerm) params.append('nome', searchTerm);
      params.append('limite', '20');
      params.append('page', page.toString());

      const queryString = params.toString();
      const url = `/categorias${queryString ? `?${queryString}` : ''}`;

      return await get<CategoriaApiResponse>(url);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // O SSR só faz prefetch da aba padrão (consumo/almoxarifado) — nas
    // outras abas o placeholder ficaria com dados do domínio errado.
    placeholderData:
      initialData && tipo === 'consumo'
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
    if (!isFetching && atualizandoCategoriaId) {
      setAtualizandoCategoriaId(null);
    }
  }, [isFetching, atualizandoCategoriaId]);

  const handleAdicionarClick = () => {
    setIsCadastrarModalOpen(true);
  };

  const handleCadastrarSuccess = () => {
    refetch();
  };

  const handleEditarSuccess = () => {
    if (editarCategoriaId) {
      setAtualizandoCategoriaId(editarCategoriaId);
    }
    refetch();
  };

  const handleEdit = (id: string) => {
    setEditarCategoriaId(id);
    setIsEditarModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setExcluirCategoriaId(id);
    setIsExcluirModalOpen(true);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    toast.success('Categoria excluída com sucesso!', {
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

  const categorias = data?.pages.flatMap((page) => page.data.docs) || [];

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="categorias-page"
    >
      <Cabecalho pagina="Categorias" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-1 max-w-full">
        <div
          className="flex gap-1 mb-4 shrink-0 border-b border-border"
          data-test="categorias-tabs"
        >
          {(['consumo', 'permanente'] as const).map((opcaoTipo) => (
            <button
              key={opcaoTipo}
              type="button"
              onClick={() => setTipo(opcaoTipo)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                tipo === opcaoTipo
                  ? 'border-[var(--ei-accent)] text-[var(--ei-accent)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-test={`categorias-tab-${opcaoTipo}`}
            >
              {ITEM_TIPO_LABEL_CURTO[opcaoTipo]}
            </button>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar categorias..."
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
            Erro ao carregar categorias: {error.message}
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
                Carregando categorias...
              </p>
            </div>
          ) : categorias.length > 0 ? (
            <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  className="w-full min-w-[600px] caption-bottom text-xs sm:text-sm"
                  data-test="categorias-table"
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
                    {categorias.map((categoria, index) => (
                      <TableRow
                        key={categoria._id}
                        data-test={`categoria-row-${index}`}
                        className="hover:bg-muted border-b relative"
                        style={{ height: '60px' }}
                      >
                        {atualizandoCategoriaId === categoria._id &&
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
                            title={categoria.nome}
                          >
                            {categoria.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2">
                          <span
                            className="truncate block max-w-[300px] mx-auto"
                            title={categoria.descricao || '-'}
                          >
                            {categoria.descricao || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(categoria._id)}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-[var(--ei-accent)] hover:bg-[var(--ei-accent)]/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Editar categoria"
                              data-test="edit-button"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(categoria._id)}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir categoria"
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
                icon={Tag}
                title={
                  searchTerm
                    ? 'Nenhum resultado'
                    : `Nenhuma categoria de ${ITEM_TIPO_LABEL_CURTO[tipo].toLowerCase()} cadastrada`
                }
                subtitle={
                  searchTerm
                    ? 'Tente ajustar sua pesquisa.'
                    : 'Comece adicionando a primeira categoria.'
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

      {excluirCategoriaId && (
        <ModalExcluirCategoria
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setTimeout(() => setExcluirCategoriaId(null), 300);
          }}
          onSuccess={handleExcluirSuccess}
          categoriaId={excluirCategoriaId}
          categoriaNome={
            categorias.find((c) => c._id === excluirCategoriaId)?.nome || ''
          }
        />
      )}

      <ModalCadastrarCategoria
        isOpen={isCadastrarModalOpen}
        onClose={() => setIsCadastrarModalOpen(false)}
        onSuccess={handleCadastrarSuccess}
        tipo={tipo}
      />

      {editarCategoriaId && (
        <ModalEditarCategoria
          isOpen={isEditarModalOpen}
          onClose={() => {
            setIsEditarModalOpen(false);
            setTimeout(() => setEditarCategoriaId(null), 300);
          }}
          categoriaId={editarCategoriaId}
          categoriaNome={
            categorias.find((c) => c._id === editarCategoriaId)?.nome || ''
          }
          categoriaDescricao={
            categorias.find((c) => c._id === editarCategoriaId)?.descricao
          }
          onSuccess={handleEditarSuccess}
        />
      )}
    </div>
  );
}
