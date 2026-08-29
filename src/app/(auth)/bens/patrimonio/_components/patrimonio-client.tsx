'use client';

// Grade de unidades patrimoniais — cada patrimônio físico (ACC-0001,
// ACC-0002...) é um card próprio, não um contador agregado por modelo.
// Clicar no card abre o detalhe da unidade; o menu "..." do card concentra
// as ações (Editar/Emprestar/Manutenção/Transferir/Baixar/Remover).

import CardPatrimonio from '@/components/card-patrimonio';
import Cabecalho from '@/components/cabecalho';
import ModalFiltros from '@/components/modal-filtros';
import ModalCadastrarPatrimonio from '@/components/modal-cadastrar-patrimonio';
import PatrimonioAcoesModais from '@/components/patrimonio-acoes-modais';
import PatrimonioLinhaAcoes from '@/components/patrimonio-linha-acoes';
import ViewModeToggle from '@/components/view-mode-toggle';
import OrdenarPorSelect from '@/components/ordenar-por-select';
import StatusBadge from '@/components/status-badge';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { useViewMode } from '@/hooks/use-view-mode';
import type { ApiEnvelope, Localizacao } from '@/types/itens';
import type { CategoriaApiResponse } from '@/types/categorias';
import {
  PATRIMONIO_STATUS_OPTIONS,
  type PatrimonioApiResponse,
} from '@/types/patrimonios';
import { Search, SlidersHorizontal, Plus, Boxes, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQueryState } from 'nuqs';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';
import { useAcoesPatrimonio } from '@/hooks/use-acoes-patrimonio';
import { ORDENACAO_PATRIMONIO } from '@/lib/ordenacao';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...PATRIMONIO_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: status,
  })),
];

export default function PatrimonioPageContent({
  initialData,
}: {
  initialData?: PatrimonioApiResponse;
}) {
  const [busca, setBusca] = useQueryState('busca', { defaultValue: '' });
  const [categoriaFiltro, setCategoriaFiltro] = useQueryState('categoria', {
    defaultValue: '',
  });
  const [statusFiltro, setStatusFiltro] = useQueryState('status', {
    defaultValue: '',
  });
  const [localizacaoFiltro, setLocalizacaoFiltro] = useQueryState(
    'localizacao',
    { defaultValue: '' },
  );
  const [ordenar, setOrdenar] = useQueryState('ordenar', {
    defaultValue: '',
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [viewMode, setViewMode] = useViewMode('patrimonio');

  const {
    contexto,
    abrir: abrirAcao,
    fechar: fecharAcao,
  } = useAcoesPatrimonio();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PatrimonioApiResponse>({
    queryKey: [
      'patrimonios',
      'lista',
      busca,
      categoriaFiltro,
      statusFiltro,
      localizacaoFiltro,
      ordenar,
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (categoriaFiltro) params.append('categoria', categoriaFiltro);
      if (statusFiltro) params.append('status', statusFiltro);
      if (localizacaoFiltro) params.append('localizacao', localizacaoFiltro);
      if (ordenar) params.append('ordenar', ordenar);
      params.append('limite', '20');
      params.append('page', page.toString());

      return await get<PatrimonioApiResponse>(
        `/patrimonios?${params.toString()}`,
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

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Paginação por número de página: se um patrimônio muda de posição na
  // ordenação entre um fetch e outro (ex.: número editado), a mesma unidade
  // pode aparecer em duas páginas já carregadas — dedupe por _id evita a
  // colisão de key no React.
  const unidadesBrutas = data?.pages.flatMap((page) => page.data.docs) || [];
  const unidades = Array.from(
    new Map(unidadesBrutas.map((u) => [u._id, u])).values(),
  );

  const { data: localizacoesData } = useQuery<ApiEnvelope<Localizacao>>({
    queryKey: ['localizacoes'],
    queryFn: () => get<ApiEnvelope<Localizacao>>('/localizacoes?limite=100'),
  });
  const localizacoes = localizacoesData?.data?.docs ?? [];

  const { data: categoriasData } = useQuery<CategoriaApiResponse>({
    queryKey: ['categorias', 'permanente'],
    queryFn: () =>
      get<CategoriaApiResponse>('/categorias?tipo=permanente&limite=100'),
    enabled: !!categoriaFiltro,
  });
  const categoriaNome = categoriasData?.data?.docs?.find(
    (cat) => cat._id === categoriaFiltro,
  )?.nome;

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
              placeholder="Buscar por número de patrimônio ou modelo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 bg-background/30 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="search-input"
            />
          </div>
          <Select
            value={localizacaoFiltro || 'todas'}
            onValueChange={(value) =>
              setLocalizacaoFiltro(value === 'todas' ? '' : value)
            }
          >
            <SelectTrigger
              className="w-full sm:w-56 bg-background/30 dark:bg-input/30"
              data-test="filtro-localizacao"
            >
              <SelectValue placeholder="Todas as localizações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as localizações</SelectItem>
              {localizacoes.map((loc) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <OrdenarPorSelect
            value={ordenar}
            onChange={setOrdenar}
            opcoes={ORDENACAO_PATRIMONIO}
          />
          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer bg-background/30 hover:bg-background/50"
            data-test="filtros-button"
            onClick={() => setIsFiltrosModalOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </Button>
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            data-test="patrimonio-view-toggle"
          />
          <Button
            className="h-11 px-4 flex items-center gap-2 text-ei-accent-foreground font-semibold tracking-tight hover:opacity-95 shadow-sm cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="adicionar-button"
            onClick={() => setIsCadastrarModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-4">
          {(categoriaFiltro || statusFiltro || localizacaoFiltro) && (
            <div
              className="mb-4 flex flex-wrap items-center gap-2"
              data-test="applied-filters"
            >
              {statusFiltro && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted text-foreground rounded-md text-xs border border-border font-medium">
                  <span className="font-medium">Status:</span>
                  <span>{statusFiltro}</span>
                  <button
                    onClick={() => setStatusFiltro('')}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de status"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {categoriaFiltro && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted text-foreground rounded-md text-xs border border-border font-medium">
                  <span className="font-medium">Categoria:</span>
                  <span>{categoriaNome ?? 'Carregando...'}</span>
                  <button
                    onClick={() => setCategoriaFiltro('')}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de categoria"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md"
              data-test="error-message"
              title={`Erro completo: ${error.message}`}
            >
              Erro ao carregar unidades: {error.message}
            </div>
          )}

          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              data-test="loading-spinner"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando unidades...
              </p>
            </div>
          ) : unidades.length > 0 ? (
            viewMode === 'cards' ? (
              <div
                className="grid gap-4 w-full"
                style={{
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(max(300px, min(400px, calc((100% - 3rem) / 6))), 1fr))',
                }}
                data-test="patrimonio-grid"
              >
                {unidades.map((unidade, index) => (
                  <CardPatrimonio
                    key={unidade._id}
                    unidade={unidade}
                    onClick={(u) => abrirAcao('historico', u)}
                    onAcao={abrirAcao}
                    data-test={`patrimonio-card-${index}`}
                  />
                ))}
              </div>
            ) : (
              <div
                className="border rounded-md bg-card overflow-x-auto"
                data-test="patrimonio-table"
              >
                <table className="w-full min-w-[700px] caption-bottom text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted border-b">
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        PATRIMÔNIO
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        MODELO
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        CATEGORIA
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        LOCALIZAÇÃO
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
                    {unidades.map((unidade, index) => (
                      <TableRow
                        key={unidade._id}
                        data-test={`patrimonio-row-${index}`}
                        onClick={() => abrirAcao('historico', unidade)}
                        className="hover:bg-muted border-b cursor-pointer"
                        style={{ height: '56px' }}
                      >
                        <TableCell
                          className="font-medium text-left px-6 py-2 truncate max-w-[160px]"
                          title={unidade.numero_patrimonio}
                        >
                          {unidade.numero_patrimonio}
                        </TableCell>
                        <TableCell
                          className="text-left px-6 py-2 truncate max-w-[200px]"
                          title={unidade.modelo || '-'}
                        >
                          {unidade.modelo || '-'}
                        </TableCell>
                        <TableCell
                          className="text-left px-6 py-2 truncate max-w-[160px]"
                          title={unidade.categoria.nome}
                        >
                          {unidade.categoria.nome}
                        </TableCell>
                        <TableCell
                          className="text-left px-6 py-2 truncate max-w-[160px]"
                          title={unidade.localizacao?.nome ?? '-'}
                        >
                          {unidade.localizacao?.nome ?? '-'}
                        </TableCell>
                        <TableCell className="text-center px-6 py-2">
                          <StatusBadge
                            status={unidade.status}
                            size="sm"
                            data-test="patrimonio-row-status"
                          />
                        </TableCell>
                        <TableCell className="text-center px-6 py-2">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex justify-center"
                          >
                            <PatrimonioLinhaAcoes
                              unidade={unidade}
                              onAcao={abrirAcao}
                              data-test={`patrimonio-row-acoes-${index}`}
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
              icon={Boxes}
              title={
                busca || categoriaFiltro || statusFiltro || localizacaoFiltro
                  ? 'Nenhum resultado'
                  : 'Nenhuma unidade de patrimônio cadastrada'
              }
              subtitle={
                busca || categoriaFiltro || statusFiltro || localizacaoFiltro
                  ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                  : 'Comece adicionando a primeira unidade.'
              }
            />
          )}

          {unidades.length > 0 && (
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

      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={() => setIsFiltrosModalOpen(false)}
        categoriaFilter={categoriaFiltro}
        statusFilter={statusFiltro}
        statusOptions={STATUS_OPTIONS}
        onFiltersChange={(categoria, status) => {
          setCategoriaFiltro(categoria);
          setStatusFiltro(status);
        }}
        tipo="permanente"
      />

      <ModalCadastrarPatrimonio
        isOpen={isCadastrarModalOpen}
        onClose={() => setIsCadastrarModalOpen(false)}
      />

      <PatrimonioAcoesModais contexto={contexto} onFechar={fecharAcao} />

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
