'use client';
import CardItemConsumo from '@/components/card-item-consumo';
import Cabecalho from '@/components/cabecalho';
import ModalLocalizacoes from '@/components/modal-localizacoes';
import ModalFiltros from '@/components/modal-filtros';
import ModalEntradaItem from '@/components/modal-entrada-item';
import ModalSaidaItem from '@/components/modal-saida-item';
import ModalEmprestarItem from '@/components/modal-emprestar-item';
import ModalExcluirItem from '@/components/modal-excluir-item';
import ModalCadastrarItemConsumo from '@/components/modal-cadastrar-item-consumo';
import ModalEditarItem from '@/components/modal-editar-item';
import ItemConsumoLinhaAcoes from '@/components/item-consumo-linha-acoes';
import ViewModeToggle from '@/components/view-mode-toggle';
import OrdenarPorSelect from '@/components/ordenar-por-select';
import StatusBadge from '@/components/status-badge';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { useViewMode } from '@/hooks/use-view-mode';
import { ORDENACAO_ITENS_CONSUMO } from '@/lib/ordenacao';
import { ItemConsumoApiResponse, EstoqueApiResponse } from '@/types/itens';
import type { CategoriaApiResponse } from '@/types/categorias';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Package,
  X,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

export default function ConsumoPageContent({
  initialData,
}: {
  initialData?: ItemConsumoApiResponse;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [editarItemId, setEditarItemId] = useState<string | null>(null);
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [entradaItemId, setEntradaItemId] = useState<string | null>(null);
  const [isSaidaModalOpen, setIsSaidaModalOpen] = useState(false);
  const [saidaItemId, setSaidaItemId] = useState<string | null>(null);
  const [isEmprestimoModalOpen, setIsEmprestimoModalOpen] = useState(false);
  const [emprestimoItemId, setEmprestimoItemId] = useState<string | null>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirItemId, setExcluirItemId] = useState<string | null>(null);
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useViewMode('almoxarifado');

  const [categoriaFilter, setCategoriaFilter] = useQueryState('categoria', {
    defaultValue: '',
  });
  const [statusFilter, setStatusFilter] = useQueryState('status', {
    defaultValue: '',
  });
  const [ordenar, setOrdenar] = useQueryState('ordenar', {
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
  } = useInfiniteQuery<ItemConsumoApiResponse>({
    queryKey: [
      'itens',
      'consumo',
      searchTerm,
      categoriaFilter,
      statusFilter,
      ordenar,
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('tipo', 'consumo');
      if (searchTerm) params.append('nome', searchTerm);
      if (categoriaFilter) params.append('categoria', categoriaFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (ordenar) params.append('ordenar', ordenar);
      params.append('limite', '15');
      params.append('page', page.toString());

      return await get<ItemConsumoApiResponse>(`/itens?${params.toString()}`);
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

  const { data: estoquesData, isLoading: isLoadingEstoques } =
    useQuery<EstoqueApiResponse>({
      queryKey: ['estoques', selectedItemId],
      queryFn: async () => {
        return await get<EstoqueApiResponse>(
          `/estoques/item/${selectedItemId}`,
        );
      },
      enabled: !!selectedItemId,
    });

  const { data: categoriasData } = useQuery<CategoriaApiResponse>({
    queryKey: ['categorias', 'consumo'],
    queryFn: async () => {
      return await get<CategoriaApiResponse>(
        '/categorias?tipo=consumo&limite=100&page=1',
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
    toast.success('Item criado com sucesso!', {
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

  const handleItemClick = (id: string) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedItemId(null), 300);
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

  const handleEntrada = (id: string) => {
    setEntradaItemId(id);
    setIsEntradaModalOpen(true);
  };

  const handleSaida = (id: string) => {
    setSaidaItemId(id);
    setIsSaidaModalOpen(true);
  };

  const handleCloseEntradaModal = () => {
    setIsEntradaModalOpen(false);
    setTimeout(() => setEntradaItemId(null), 300);
  };

  const handleEntradaSuccess = () => {
    if (entradaItemId) {
      setUpdatingItemId(entradaItemId);
    }
    toast.success('Entrada registrada com sucesso!', {
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

  const handleCloseSaidaModal = () => {
    setIsSaidaModalOpen(false);
    setTimeout(() => setSaidaItemId(null), 300);
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

  const handleSaidaSuccess = () => {
    if (saidaItemId) {
      setUpdatingItemId(saidaItemId);
    }
    toast.success('Saída registrada com sucesso!', {
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
      data-test="almoxarifado-page"
    >
      <Cabecalho pagina="Almoxarifado" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 pb-0">
        <div
          className="flex flex-col sm:flex-row gap-3 shrink-0 sticky top-0 z-10 -mx-6 px-6 py-2 bg-background/40 backdrop-blur-xl"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 bg-background/30 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="search-input"
            />
          </div>
          <OrdenarPorSelect
            value={ordenar}
            onChange={setOrdenar}
            opcoes={ORDENACAO_ITENS_CONSUMO}
          />
          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer bg-background/30 hover:bg-background/50"
            data-test="filtros-button"
            onClick={handleOpenFiltrosModal}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </Button>
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            data-test="almoxarifado-view-toggle"
          />
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pr-2 pb-4">
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
            viewMode === 'cards' ? (
              <div
                className="grid gap-4 w-full"
                style={{
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(max(300px, min(400px, calc((100% - 3rem) / 6))), 1fr))',
                }}
                data-test="almoxarifado-grid"
              >
                {itens.map((item, index) => (
                  <CardItemConsumo
                    key={item._id}
                    id={item._id}
                    nome={item.nome}
                    categoria={item.categoria.nome}
                    quantidade={item.quantidade}
                    estoqueMinimo={item.estoque_minimo}
                    status={item.status}
                    imagem={item.imagem}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onClick={handleItemClick}
                    onEntrada={handleEntrada}
                    onSaida={handleSaida}
                    onEmprestar={handleEmprestar}
                    isLoading={updatingItemId === item._id && isFetching}
                    data-test={`item-card-${index}`}
                  />
                ))}
              </div>
            ) : (
              <div
                className="border rounded-md bg-card overflow-x-auto"
                data-test="almoxarifado-table"
              >
                <table className="w-full min-w-[700px] caption-bottom text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted border-b">
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        ITEM
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        CATEGORIA
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        QTD
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        MÍN
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        STATUS
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow
                        key={item._id}
                        data-test={`item-row-${index}`}
                        onClick={() => handleItemClick(item._id)}
                        className="hover:bg-muted border-b cursor-pointer"
                        style={{ height: '56px' }}
                      >
                        <TableCell
                          className="font-medium text-left px-6 py-2 truncate max-w-[220px]"
                          title={item.nome}
                        >
                          {item.nome}
                        </TableCell>
                        <TableCell
                          className="text-left px-6 py-2 truncate max-w-[160px]"
                          title={item.categoria.nome}
                        >
                          {item.categoria.nome}
                        </TableCell>
                        <TableCell className="text-center px-6 py-2">
                          {item.quantidade}
                        </TableCell>
                        <TableCell className="text-center px-6 py-2">
                          {item.estoque_minimo}
                        </TableCell>
                        <TableCell className="text-center px-6 py-2">
                          <StatusBadge
                            status={item.status}
                            size="sm"
                            data-test="item-row-status"
                          />
                        </TableCell>
                        <TableCell className="text-center px-6 py-2">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-0.5"
                          >
                            <button
                              className="p-1.5 rounded-md hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
                              title={`Registrar entrada de ${item.nome}`}
                              data-test="entrada-icon"
                              onClick={() => handleEntrada(item._id)}
                            >
                              <PlusCircle
                                size={16}
                                className="text-foreground"
                              />
                            </button>
                            <button
                              className={`p-1.5 rounded-md transition-colors duration-150 ${
                                item.quantidade === 0
                                  ? 'opacity-30 cursor-not-allowed'
                                  : 'hover:bg-muted/40 cursor-pointer'
                              }`}
                              title={
                                item.quantidade === 0
                                  ? `${item.nome} sem estoque disponível`
                                  : `Registrar saída de ${item.nome}`
                              }
                              data-test="saida-icon"
                              disabled={item.quantidade === 0}
                              onClick={
                                item.quantidade === 0
                                  ? undefined
                                  : () => handleSaida(item._id)
                              }
                            >
                              <MinusCircle
                                size={16}
                                className={
                                  item.quantidade === 0
                                    ? 'text-muted-foreground'
                                    : 'text-foreground'
                                }
                              />
                            </button>
                            <ItemConsumoLinhaAcoes
                              onEditar={() => handleEdit(item._id)}
                              onEmprestar={() => handleEmprestar(item._id)}
                              onExcluir={() => handleDelete(item._id)}
                              emprestarDesabilitado={item.quantidade === 0}
                              emprestarTitle={`${item.nome} sem estoque disponível para empréstimo`}
                              data-test={`item-row-acoes-${index}`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            )
          ) : (
            <EmptyState
              icon={Package}
              title={
                searchTerm || categoriaFilter || statusFilter
                  ? 'Nenhum resultado'
                  : 'Nenhum item cadastrado'
              }
              subtitle={
                searchTerm || categoriaFilter || statusFilter
                  ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                  : 'Comece adicionando o primeiro item ao almoxarifado.'
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

      {selectedItemId && (
        <ModalLocalizacoes
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          itemId={selectedItemId}
          itemNome={itens.find((c) => c._id === selectedItemId)?.nome || ''}
          itemDescricao={itens.find((c) => c._id === selectedItemId)?.descricao}
          estoques={estoquesData?.data?.docs || []}
          isLoading={isLoadingEstoques}
          totalQuantidade={
            estoquesData?.data?.docs
              ?.filter(
                (estoque) =>
                  estoque.quantidade != null &&
                  !isNaN(Number(estoque.quantidade)) &&
                  Number(estoque.quantidade) > 0,
              )
              .reduce(
                (total, estoque) => total + Number(estoque.quantidade),
                0,
              ) || 0
          }
        />
      )}

      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={handleCloseFiltrosModal}
        categoriaFilter={categoriaFilter}
        statusFilter={statusFilter}
        onFiltersChange={handleFiltersChange}
        tipo="consumo"
      />

      <ModalCadastrarItemConsumo
        isOpen={isCadastrarModalOpen}
        onClose={handleCloseCadastrarModal}
        onSuccess={handleCadastrarSuccess}
      />

      {editarItemId && (
        <ModalEditarItem
          isOpen={isEditarModalOpen}
          onClose={handleCloseEditarModal}
          itemId={editarItemId}
          tipo="consumo"
          onSuccess={handleEditarSuccess}
        />
      )}

      {entradaItemId && (
        <ModalEntradaItem
          isOpen={isEntradaModalOpen}
          onClose={handleCloseEntradaModal}
          itemId={entradaItemId}
          itemNome={itens.find((c) => c._id === entradaItemId)?.nome || ''}
          onSuccess={handleEntradaSuccess}
        />
      )}

      {saidaItemId && (
        <ModalSaidaItem
          isOpen={isSaidaModalOpen}
          onClose={handleCloseSaidaModal}
          itemId={saidaItemId}
          itemNome={itens.find((c) => c._id === saidaItemId)?.nome || ''}
          onSuccess={handleSaidaSuccess}
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
        <ModalEmprestarItem
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
