'use client';
import CardItemPatrimonio from '@/components/card-item-patrimonio';
import Cabecalho from '@/components/cabecalho';
import ModalFiltros from '@/components/modal-filtros';
import ModalExcluirItem from '@/components/modal-excluir-item';
import ModalCadastrarItemPatrimonio from '@/components/modal-cadastrar-item-patrimonio';
import ModalEditarItem from '@/components/modal-editar-item';
import ModalEmprestarUnidade from '@/components/modal-emprestar-unidade';
import SheetUnidadesItem from '@/components/sheet-unidades-item';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { ItemPermanenteApiResponse } from '@/types/itens';
import type { CategoriaApiResponse } from '@/types/categorias';
import { Search, Filter, Plus, Boxes, ListChecks, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

// Item permanente nunca assume "Baixo Estoque" — o hook do backend calcula
// o status a partir de `quantidade_disponivel`, não de estoque mínimo.
const STATUS_OPTIONS_PERMANENTE = [
  { value: '', label: 'Todos os status' },
  { value: 'Em Estoque', label: 'Em Estoque' },
  { value: 'Indisponível', label: 'Indisponível' },
];

export default function PatrimonioPageContent({
  initialData,
}: {
  initialData?: ItemPermanenteApiResponse;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [editarItemId, setEditarItemId] = useState<string | null>(null);
  const [isEmprestimoModalOpen, setIsEmprestimoModalOpen] = useState(false);
  const [emprestimoItemId, setEmprestimoItemId] = useState<string | null>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirItemId, setExcluirItemId] = useState<string | null>(null);
  const [isUnidadesSheetOpen, setIsUnidadesSheetOpen] = useState(false);
  const [unidadesItemId, setUnidadesItemId] = useState<string | null>(null);
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [categoriaFilter, setCategoriaFilter] = useQueryState('categoria', {
    defaultValue: '',
  });
  const [statusFilter, setStatusFilter] = useQueryState('status', {
    defaultValue: '',
  });

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ItemPermanenteApiResponse>({
    queryKey: [
      'itens',
      'permanente',
      searchTerm,
      categoriaFilter,
      statusFilter,
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('tipo', 'permanente');
      if (searchTerm) params.append('nome', searchTerm);
      if (categoriaFilter) params.append('categoria', categoriaFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limite', '15');
      params.append('page', page.toString());

      return await get<ItemPermanenteApiResponse>(
        `/itens?${params.toString()}`,
      );
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

  const { data: categoriasData } = useQuery<CategoriaApiResponse>({
    queryKey: ['categorias', 'permanente'],
    queryFn: async () => {
      return await get<CategoriaApiResponse>(
        '/categorias?tipo=permanente&limite=100&page=1',
      );
    },
  });

  const handleEdit = (id: string) => {
    setEditarItemId(id);
    setIsEditarModalOpen(true);
  };

  const handleCloseCadastrarModal = () => {
    setIsCadastrarModalOpen(false);
  };

  const handleCadastrarSuccess = () => {
    toast.success('Bem permanente criado com sucesso!', {
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
    setTimeout(() => setEditarItemId(null), 300);
  };

  const handleEditarSuccess = () => {
    if (editarItemId) {
      setUpdatingItemId(editarItemId);
    }
    toast.success('Item atualizado com sucesso!', {
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

  const handleDelete = (id: string) => {
    setExcluirItemId(id);
    setIsExcluirModalOpen(true);
  };

  const handleVerUnidades = (id: string) => {
    setUnidadesItemId(id);
    setIsUnidadesSheetOpen(true);
  };

  const handleCloseUnidadesSheet = (open: boolean) => {
    setIsUnidadesSheetOpen(open);
    if (!open) {
      setTimeout(() => setUnidadesItemId(null), 300);
    }
  };

  const handleOpenFiltrosModal = () => {
    setIsFiltrosModalOpen(true);
  };

  const handleCloseFiltrosModal = () => {
    setIsFiltrosModalOpen(false);
  };

  const handleFiltersChange = (categoria: string, status: string) => {
    setCategoriaFilter(categoria);
    setStatusFilter(status);
  };

  const handleEmprestar = (id: string) => {
    setEmprestimoItemId(id);
    setIsEmprestimoModalOpen(true);
  };

  const handleCloseEmprestimoModal = () => {
    setIsEmprestimoModalOpen(false);
    setTimeout(() => setEmprestimoItemId(null), 300);
  };

  const handleEmprestimoSuccess = () => {
    if (emprestimoItemId) {
      setUpdatingItemId(emprestimoItemId);
    }
    refetch();
  };

  const handleCloseExcluirModal = () => {
    setIsExcluirModalOpen(false);
    setTimeout(() => setExcluirItemId(null), 300);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    toast.success('Item excluído com sucesso!', {
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

  const handleAdicionarClick = () => {
    setIsCadastrarModalOpen(true);
  };

  useEffect(() => {
    if (!isFetching && updatingItemId) {
      setUpdatingItemId(null);
    }
  }, [isFetching, updatingItemId]);

  const itens = data?.pages.flatMap((page) => page.data.docs) || [];

  return (
    <div
      className="w-full h-screen flex flex-col overflow-x-hidden"
      data-test="patrimonio-page"
    >
      <Cabecalho pagina="Patrimônio" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 pb-0">
        <div
          className="flex flex-col sm:flex-row gap-3 shrink-0 sticky top-0 z-10 -mx-6 px-6 py-2 bg-background/40 backdrop-blur-xl"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar bens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 bg-background/30 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="search-input"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer bg-background/30 hover:bg-background/50"
            data-test="filtros-button"
            onClick={handleOpenFiltrosModal}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer bg-background/30 hover:bg-background/50"
            data-test="patrimonio-ver-unidades-button"
            onClick={() => router.push('/bens/patrimonio/unidades')}
          >
            <ListChecks className="w-4 h-4" />
            Ver todas as unidades
          </Button>
          <Button
            className="h-11 px-4 flex items-center gap-2 text-ei-accent-foreground font-semibold tracking-tight hover:opacity-95 shadow-sm cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="adicionar-button"
            onClick={handleAdicionarClick}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-4">
          {(categoriaFilter || statusFilter) && (
            <div className="mb-4" data-test="applied-filters">
              <div className="flex flex-wrap items-center gap-2">
                {categoriaFilter && (
                  <div
                    className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted text-foreground rounded-md text-xs border border-border font-medium"
                    data-test="applied-filter-categoria"
                  >
                    <span className="font-medium">Categoria:</span>
                    <span data-test="applied-filter-categoria-nome">
                      {categoriasData?.data?.docs?.find(
                        (cat: any) => cat._id === categoriaFilter,
                      )?.nome || 'Carregando...'}
                    </span>
                    <button
                      onClick={() => setCategoriaFilter('')}
                      className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                      title="Remover filtro de categoria"
                      data-test="applied-filter-categoria-remover"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
                {statusFilter && (
                  <div
                    className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted text-foreground rounded-md text-xs border border-border font-medium"
                    data-test="applied-filter-status"
                  >
                    <span className="font-medium">Status:</span>
                    <span data-test="applied-filter-status-nome">
                      {statusFilter}
                    </span>
                    <button
                      onClick={() => setStatusFilter('')}
                      className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                      title="Remover filtro de status"
                      data-test="applied-filter-status-remover"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div
              className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md"
              data-test="error-message"
              title={`Erro completo: ${error.message}`}
            >
              Erro ao carregar itens: {error.message}
            </div>
          )}

          {isLoading || isRefetchingAfterDelete ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              data-test="loading-spinner"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando itens...
              </p>
            </div>
          ) : itens.length > 0 ? (
            <div
              className="grid gap-4 w-full"
              style={{
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(max(300px, min(400px, calc((100% - 3rem) / 6))), 1fr))',
              }}
              data-test="patrimonio-grid"
            >
              {itens.map((item, index) => (
                <CardItemPatrimonio
                  key={item._id}
                  id={item._id}
                  nome={item.nome}
                  categoria={item.categoria.nome}
                  quantidade={item.quantidade}
                  quantidadeDisponivel={item.quantidade_disponivel}
                  status={item.status}
                  imagem={item.imagem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClick={handleVerUnidades}
                  onEmprestar={handleEmprestar}
                  isLoading={updatingItemId === item._id && isFetching}
                  data-test={`item-card-${index}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Boxes}
              title={
                searchTerm || categoriaFilter || statusFilter
                  ? 'Nenhum resultado'
                  : 'Nenhum bem permanente cadastrado'
              }
              subtitle={
                searchTerm || categoriaFilter || statusFilter
                  ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                  : 'Comece adicionando o primeiro bem permanente.'
              }
            />
          )}

          {itens.length > 0 && (
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
          )}
        </div>
      </div>

      <SheetUnidadesItem
        itemId={unidadesItemId}
        itemNome={itens.find((c) => c._id === unidadesItemId)?.nome}
        open={isUnidadesSheetOpen}
        onOpenChange={handleCloseUnidadesSheet}
      />

      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={handleCloseFiltrosModal}
        categoriaFilter={categoriaFilter}
        statusFilter={statusFilter}
        statusOptions={STATUS_OPTIONS_PERMANENTE}
        onFiltersChange={handleFiltersChange}
        tipo="permanente"
      />

      <ModalCadastrarItemPatrimonio
        isOpen={isCadastrarModalOpen}
        onClose={handleCloseCadastrarModal}
        onSuccess={handleCadastrarSuccess}
      />

      {editarItemId && (
        <ModalEditarItem
          isOpen={isEditarModalOpen}
          onClose={handleCloseEditarModal}
          itemId={editarItemId}
          tipo="permanente"
          onSuccess={handleEditarSuccess}
        />
      )}

      {excluirItemId && (
        <ModalExcluirItem
          isOpen={isExcluirModalOpen}
          onClose={handleCloseExcluirModal}
          itemId={excluirItemId}
          itemNome={itens.find((c) => c._id === excluirItemId)?.nome || ''}
          onSuccess={handleExcluirSuccess}
        />
      )}

      {emprestimoItemId && (
        <ModalEmprestarUnidade
          isOpen={isEmprestimoModalOpen}
          onClose={handleCloseEmprestimoModal}
          itemId={emprestimoItemId}
          itemNome={itens.find((c) => c._id === emprestimoItemId)?.nome || ''}
          onSuccess={handleEmprestimoSuccess}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />
    </div>
  );
}
