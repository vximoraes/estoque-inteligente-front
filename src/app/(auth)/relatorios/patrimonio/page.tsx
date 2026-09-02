'use client';
import StatCard from '@/app/(auth)/relatorios/_components/stat-card';
import Cabecalho from '@/components/layout/cabecalho';
import ModalFiltros from '@/components/comum/modal-filtros';
import EmptyState from '@/components/comum/empty-state';
import StatusBadge from '@/components/comum/status-badge';
import OrdenarPorSelect from '@/components/comum/ordenar-por-select';
import { ORDENACAO_PATRIMONIO } from '@/lib/ordenacao';
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
import type { PatrimonioApiResponse } from '@/types/patrimonios';
import type { ApiEnvelope, Localizacao } from '@/types/itens';
import type { CategoriaApiResponse } from '@/types/categorias';
import { Search, SlidersHorizontal, Package, X } from 'lucide-react';
import { useEffect, useRef, useState, Suspense } from 'react';
import { PulseLoader } from 'react-spinners';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'Disponível', label: 'Disponível' },
  { value: 'Emprestado', label: 'Emprestado' },
  { value: 'Manutenção', label: 'Manutenção' },
  { value: 'Baixado', label: 'Baixado' },
];

function formatarData(data?: string) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

function RelatorioPatrimonioPageContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [localizacaoFilter, setLocalizacaoFilter] = useState('');
  const [ordenar, setOrdenar] = useState('');
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PatrimonioApiResponse>({
    queryKey: [
      'patrimonios-relatorio',
      searchTerm,
      categoriaFilter,
      statusFilter,
      localizacaoFilter,
      ordenar,
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('limite', '20');
      params.append('page', page.toString());
      if (searchTerm) {
        params.append('busca', searchTerm);
      }
      if (categoriaFilter) {
        params.append('categoria', categoriaFilter);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (localizacaoFilter) {
        params.append('localizacao', localizacaoFilter);
      }
      if (ordenar) {
        params.append('ordenar', ordenar);
      }

      const queryString = params.toString();
      const url = `/patrimonios${queryString ? `?${queryString}` : ''}`;

      return await get<PatrimonioApiResponse>(url);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) {
        return false;
      }
      return failureCount < 3;
    },
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

  const todosPatrimonios = data?.pages.flatMap((page) => page.data.docs) || [];

  // Sem endpoint de stats dedicado para patrimônio (diferente de
  // `/itens/stats`) — os contadores refletem só as páginas já carregadas
  // pelo scroll infinito, não o total absoluto quando o filtro é amplo.
  // Busca/filtros/ordenação já delegados à API — só descarta linhas com
  // categoria/localização não populadas (guarda defensiva).
  const patrimoniosFiltrados = todosPatrimonios.filter(
    (patrimonio) => patrimonio?.categoria && patrimonio?.localizacao,
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
    enabled: !!categoriaFilter,
  });
  const categoriaNome = categoriasData?.data?.docs?.find(
    (cat) => cat._id === categoriaFilter,
  )?.nome;

  const totalUnidades = patrimoniosFiltrados.length;
  const disponiveis = patrimoniosFiltrados.filter(
    (p) => p.status === 'Disponível',
  ).length;
  const emprestadas = patrimoniosFiltrados.filter(
    (p) => p.status === 'Emprestado',
  ).length;
  const baixadas = patrimoniosFiltrados.filter(
    (p) => p.status === 'Baixado',
  ).length;

  const handleOpenFiltrosModal = () => setIsFiltrosModalOpen(true);
  const handleCloseFiltrosModal = () => setIsFiltrosModalOpen(false);
  const handleFiltersChange = (categoria: string, status: string) => {
    setCategoriaFilter(categoria);
    setStatusFilter(status);
  };

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="relatorio-patrimonio-page"
    >
      <Cabecalho pagina="Relatórios" acao="Patrimônio" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        <div className="shrink-0 mb-6">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
            data-test="stats-grid"
          >
            <StatCard
              title="Total de unidades"
              value={totalUnidades}
              data-test="stat-total-unidades"
              hoverTitle={`Total de unidades carregadas: ${totalUnidades}`}
            />
            <StatCard
              title="Disponíveis"
              value={disponiveis}
              data-test="stat-disponiveis"
              hoverTitle={`Unidades disponíveis: ${disponiveis}`}
            />
            <StatCard
              title="Emprestadas"
              value={emprestadas}
              data-test="stat-emprestadas"
              hoverTitle={`Unidades emprestadas: ${emprestadas}`}
            />
            <StatCard
              title="Baixadas"
              value={baixadas}
              data-test="stat-baixadas"
              hoverTitle={`Unidades baixadas: ${baixadas}`}
            />
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar por nº de patrimônio, modelo ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="search-input"
            />
          </div>
          <Select
            value={localizacaoFilter || 'todas'}
            onValueChange={(value) =>
              setLocalizacaoFilter(value === 'todas' ? '' : value)
            }
          >
            <SelectTrigger
              className="w-full sm:w-56"
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
            className="h-11 px-4 flex items-center gap-2 cursor-pointer"
            data-test="filtros-button"
            onClick={handleOpenFiltrosModal}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {(categoriaFilter || statusFilter || localizacaoFilter) && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div
              className="flex flex-wrap items-center gap-2"
              data-test="filters-container"
            >
              {statusFilter && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                  data-test="filter-tag-status"
                >
                  <span className="font-medium">Status:</span>
                  <span>{statusFilter}</span>
                  <button
                    onClick={() => setStatusFilter('')}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de status"
                    data-test="remove-status-filter"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {categoriaFilter && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                  data-test="filter-tag-categoria"
                >
                  <span className="font-medium">Categoria:</span>
                  <span>{categoriaNome ?? 'Carregando...'}</span>
                  <button
                    onClick={() => setCategoriaFilter('')}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de categoria"
                    data-test="remove-categoria-filter"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {localizacaoFilter && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-md text-xs border border-border"
                  data-test="filter-tag-localizacao"
                >
                  <span className="font-medium">Localização:</span>
                  <span>
                    {localizacoes.find((loc) => loc._id === localizacaoFilter)
                      ?.nome ?? 'Carregando...'}
                  </span>
                  <button
                    onClick={() => setLocalizacaoFilter('')}
                    className="ml-1 p-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Remover filtro de localização"
                    data-test="remove-localizacao-filter"
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
            className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0"
            data-test="error-message"
            title={`Erro completo: ${error.message}`}
          >
            Erro ao carregar patrimônios: {error.message}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando patrimônio...
              </p>
            </div>
          ) : patrimoniosFiltrados.length > 0 ? (
            <div className="border border-border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[900px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-left px-8"
                        data-test="table-head-numero"
                      >
                        Nº PATRIMÔNIO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-left px-8"
                        data-test="table-head-modelo"
                      >
                        MODELO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-localizacao"
                      >
                        LOCALIZAÇÃO
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-status"
                      >
                        STATUS
                      </TableHead>
                      <TableHead
                        className="font-semibold text-muted-foreground bg-muted text-center px-8"
                        data-test="table-head-aquisicao"
                      >
                        AQUISIÇÃO
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patrimoniosFiltrados.map((patrimonio) => (
                      <TableRow
                        data-test="patrimonio-row"
                        key={patrimonio._id}
                        className="hover:bg-muted/35 border-b border-border"
                        style={{ height: '60px' }}
                      >
                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="patrimonio-numero"
                        >
                          {patrimonio.numero_patrimonio}
                        </TableCell>
                        <TableCell
                          className="font-medium text-left px-8 py-3"
                          data-test="patrimonio-modelo"
                        >
                          <span
                            className="truncate block max-w-[220px]"
                            title={
                              patrimonio.modelo || patrimonio.categoria.nome
                            }
                          >
                            {patrimonio.modelo || patrimonio.categoria.nome}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-center px-8 py-3 font-medium"
                          data-test="patrimonio-localizacao"
                        >
                          <span
                            className="truncate inline-block max-w-[180px]"
                            title={patrimonio.localizacao.nome}
                          >
                            {patrimonio.localizacao.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-3 whitespace-nowrap">
                          <div
                            className="flex justify-center"
                            data-test="patrimonio-status"
                          >
                            <StatusBadge status={patrimonio.status} />
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-center px-8 py-3 font-medium"
                          data-test="patrimonio-aquisicao"
                        >
                          {formatarData(patrimonio.data_aquisicao)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

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
                icon={Package}
                title={
                  searchTerm ||
                  categoriaFilter ||
                  statusFilter ||
                  localizacaoFilter
                    ? 'Nenhum resultado'
                    : 'Nenhuma unidade cadastrada'
                }
                subtitle={
                  searchTerm ||
                  categoriaFilter ||
                  statusFilter ||
                  localizacaoFilter
                    ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                    : 'Cadastre uma unidade de patrimônio para começar.'
                }
              />
            </div>
          )}
        </div>
      </div>

      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={handleCloseFiltrosModal}
        categoriaFilter={categoriaFilter}
        statusFilter={statusFilter}
        statusOptions={statusOptions}
        onFiltersChange={handleFiltersChange}
        tipo="permanente"
        data-test="modal-filtros"
      />
    </div>
  );
}

export default function RelatorioPatrimonioPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground font-medium">
            Carregando...
          </p>
        </div>
      }
    >
      <RelatorioPatrimonioPageContent />
    </Suspense>
  );
}
