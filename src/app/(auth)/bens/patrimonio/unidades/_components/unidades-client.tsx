'use client';

import Cabecalho from '@/components/cabecalho';
import CampoLocalizacao from '@/components/item-form/campo-localizacao';
import PatrimonioLinhaAcoes from '@/components/patrimonio-linha-acoes';
import PatrimonioAcoesModais from '@/components/patrimonio-acoes-modais';
import EmptyState from '@/components/empty-state';
import StatusBadge from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import {
  PATRIMONIO_STATUS_OPTIONS,
  type PatrimonioApiResponse,
} from '@/types/patrimonios';
import { Search, Boxes, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { useRouter } from 'next/navigation';
import { PulseLoader } from 'react-spinners';
import { useAcoesPatrimonio } from '@/hooks/use-acoes-patrimonio';

export default function UnidadesPageContent({
  initialData,
}: {
  initialData?: PatrimonioApiResponse;
}) {
  const router = useRouter();
  const [busca, setBusca] = useQueryState('busca', { defaultValue: '' });
  const [statusFiltro, setStatusFiltro] = useQueryState('status', {
    defaultValue: '',
  });
  const [localizacaoFiltro, setLocalizacaoFiltro] = useQueryState(
    'localizacao',
    { defaultValue: '' },
  );
  const observerTarget = useRef<HTMLDivElement>(null);

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
    queryKey: ['patrimonios', 'lista', busca, statusFiltro, localizacaoFiltro],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (statusFiltro) params.append('status', statusFiltro);
      if (localizacaoFiltro) params.append('localizacao', localizacaoFiltro);
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

  const unidades = data?.pages.flatMap((page) => page.data.docs) || [];

  const formatarData = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  };

  return (
    <div
      className="w-full h-screen flex flex-col overflow-x-hidden"
      data-test="unidades-page"
    >
      <Cabecalho
        pagina="Unidades patrimoniais"
        showBackButton
        onBackClick={() => router.push('/bens/patrimonio')}
      />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 pb-0">
        <div
          className="flex flex-col sm:flex-row gap-3 shrink-0 sticky top-0 z-10 -mx-6 px-6 py-2 bg-background/40 backdrop-blur-xl"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1" data-test="search-container">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por número de patrimônio..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 bg-background/30 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="unidades-busca"
            />
          </div>
          <div
            className="w-full sm:w-64"
            data-test="unidades-filtro-localizacao"
          >
            <CampoLocalizacao
              value={localizacaoFiltro}
              onChange={setLocalizacaoFiltro}
              label="Localização"
              obrigatorio={false}
              permitirGerenciar={false}
              data-test="unidades-select-localizacao"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-4">
          <div
            className="grid grid-cols-4 gap-2 mb-4"
            data-test="unidades-chips"
          >
            {PATRIMONIO_STATUS_OPTIONS.map((opcao) => {
              const ativo = statusFiltro === opcao;
              return (
                <button
                  key={opcao}
                  onClick={() => setStatusFiltro(ativo ? '' : opcao)}
                  className={`h-9 px-2.5 flex items-center justify-center rounded-md text-xs border font-medium transition-colors cursor-pointer ${
                    ativo
                      ? 'border-[var(--ei-accent)] bg-[var(--ei-accent)]/15 text-[var(--ei-accent)]'
                      : 'bg-muted border-border text-foreground hover:bg-muted/70'
                  }`}
                  data-test={`unidades-chip-${opcao}`}
                >
                  {opcao}
                </button>
              );
            })}
          </div>

          {(localizacaoFiltro || statusFiltro) && (
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
            <Table data-test="unidades-tabela">
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Patrimônio</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Aquisição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((unidade) => (
                  <TableRow
                    key={unidade._id}
                    onClick={() =>
                      abrirAcao(
                        'historico',
                        unidade,
                        unidade.item._id,
                        unidade.item.nome,
                      )
                    }
                    className="h-12 cursor-pointer"
                    title={`Ver histórico de ${unidade.numero_patrimonio}`}
                    data-test={`unidades-linha-${unidade.numero_patrimonio}`}
                  >
                    <TableCell className="font-medium">
                      {unidade.numero_patrimonio}
                    </TableCell>
                    <TableCell>{unidade.item.nome}</TableCell>
                    <TableCell>{unidade.localizacao?.nome ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={unidade.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      {formatarData(unidade.data_aquisicao)}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PatrimonioLinhaAcoes
                        unidade={unidade}
                        onAcao={(tipo, u) =>
                          abrirAcao(tipo, u, u.item._id, u.item.nome)
                        }
                        data-test="unidades-acoes-trigger"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <ChevronRight size={16} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Boxes}
              title={
                busca || statusFiltro || localizacaoFiltro
                  ? 'Nenhum resultado'
                  : 'Nenhuma unidade cadastrada'
              }
              subtitle={
                busca || statusFiltro || localizacaoFiltro
                  ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                  : 'Cadastre unidades a partir de um bem permanente.'
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

      <PatrimonioAcoesModais contexto={contexto} onFechar={fecharAcao} />
    </div>
  );
}
