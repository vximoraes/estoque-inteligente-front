'use client';

import Cabecalho from '@/components/cabecalho';
import ModalCadastrarEmprestimo from '@/components/modal-cadastrar-emprestimo';
import ModalSelecionarPatrimonio from '@/components/modal-selecionar-patrimonio';
import ModalEmprestarUnidade from '@/components/modal-emprestar-unidade';
import ModalDetalhesEmprestimo from '@/components/modal-detalhes-emprestimo';
import ModalEditarEmprestimo from '@/components/modal-editar-emprestimo';
import ModalExcluirEmprestimo from '@/components/modal-excluir-emprestimo';
import ModalDevolverItem from '@/components/modal-devolver-item';
import ModalFiltros from '@/components/modal-filtros';
import EmptyState from '@/components/empty-state';
import type { PatrimonioData } from '@/types/patrimonios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { get } from '@/lib/fetchData';
import { getEmprestimoNome } from '@/lib/emprestimo';
import { EmprestimosApiResponse, Emprestimo } from '@/types/emprestimos';
import {
  Search,
  Handshake,
  Pencil,
  Plus,
  Trash2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

const TIPO_CONTROLE_LABEL: Record<'quantidade' | 'unidade', string> = {
  quantidade: 'Almoxarifado',
  unidade: 'Patrimônio',
};

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Atrasado', label: 'Atrasado' },
  { value: 'Devolvido', label: 'Devolvido' },
];

export default function EmprestimosPageContent({
  initialData,
}: {
  initialData?: EmprestimosApiResponse;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const [tipoControleRaw, setTipoControle] = useQueryState('tipo_controle', {
    defaultValue: 'unidade',
  });
  const tipoControle: 'quantidade' | 'unidade' =
    tipoControleRaw === 'quantidade' ? 'quantidade' : 'unidade';
  const [statusFilter, setStatusFilter] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [isSelecionarPatrimonioModalOpen, setIsSelecionarPatrimonioModalOpen] =
    useState(false);
  const [patrimonioParaEmprestar, setPatrimonioParaEmprestar] =
    useState<PatrimonioData | null>(null);
  const [isEmprestarUnidadeModalOpen, setIsEmprestarUnidadeModalOpen] =
    useState(false);

  const [detalhesEmprestimo, setDetalhesEmprestimo] =
    useState<Emprestimo | null>(null);
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);

  const [editarEmprestimo, setEditarEmprestimo] = useState<Emprestimo | null>(
    null,
  );
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);

  const [excluirEmprestimo, setExcluirEmprestimo] = useState<Emprestimo | null>(
    null,
  );
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);

  const [devolverEmprestimo, setDevolverEmprestimo] =
    useState<Emprestimo | null>(null);
  const [isDevolverModalOpen, setIsDevolverModalOpen] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<EmprestimosApiResponse>({
    queryKey: ['emprestimos', tipoControle, searchTerm, statusFilter],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limite', '20');
      params.append('tipo_controle', tipoControle);

      if (searchTerm) params.append('busca', searchTerm);
      if (statusFilter === 'Ativo') params.append('apenas_abertos', 'true');
      if (statusFilter === 'Atrasado') params.append('atrasados', 'true');

      return await get<EmprestimosApiResponse>(
        `/emprestimos?${params.toString()}`,
      );
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: 'always',
    placeholderData:
      initialData && tipoControle === 'unidade'
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

  const emprestimos = data?.pages.flatMap((page) => page.data.docs) || [];

  const formatarDataPrevista = (data?: string | null) => {
    if (!data) return 'Sem previsão';
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return 'Sem previsão';
    return parsed.toLocaleString('pt-BR');
  };

  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden"
      data-test="emprestimos-page"
    >
      <Cabecalho pagina="Empréstimos" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-1">
        <div
          className="flex gap-1 mb-4 shrink-0 border-b border-border"
          data-test="emprestimos-tabs"
        >
          {(['unidade', 'quantidade'] as const).map((opcaoTipoControle) => (
            <button
              key={opcaoTipoControle}
              type="button"
              onClick={() => setTipoControle(opcaoTipoControle)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                tipoControle === opcaoTipoControle
                  ? 'border-[var(--ei-accent)] text-[var(--ei-accent)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-test={`emprestimos-tab-${opcaoTipoControle}`}
            >
              {TIPO_CONTROLE_LABEL[opcaoTipoControle]}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar por item, solicitante ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[var(--ei-accent)]/35 focus-visible:border-[var(--ei-accent)]"
              data-test="search-input"
            />
          </div>

          <Button
            variant="outline"
            className="h-11 px-4 flex items-center gap-2 cursor-pointer"
            data-test="filtros-button"
            onClick={() => setIsFiltrosModalOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </Button>

          <Button
            className="h-11 px-4 flex items-center gap-2 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="adicionar-button"
            onClick={() =>
              tipoControle === 'unidade'
                ? setIsSelecionarPatrimonioModalOpen(true)
                : setIsCadastrarModalOpen(true)
            }
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {statusFilter && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md">
            Erro ao carregar empréstimos: {error.message}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center flex-1"
              data-test="loading-spinner"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando empréstimos...
              </p>
            </div>
          ) : emprestimos.length > 0 ? (
            <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  className="w-full min-w-[700px] table-fixed caption-bottom text-xs sm:text-sm"
                  data-test="emprestimos-table"
                >
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      {tipoControle === 'unidade' ? (
                        <>
                          <TableHead className="w-[16%] font-semibold text-muted-foreground text-left px-6">
                            PATRIMÔNIO
                          </TableHead>
                          <TableHead className="w-[18%] font-semibold text-muted-foreground text-left px-6">
                            MODELO
                          </TableHead>
                          <TableHead className="w-[16%] font-semibold text-muted-foreground text-left px-6">
                            SOLICITANTE
                          </TableHead>
                          <TableHead className="w-[16%] font-semibold text-muted-foreground text-center px-6">
                            DATA PREVISTA
                          </TableHead>
                          <TableHead className="w-[12%] font-semibold text-muted-foreground text-center px-6">
                            STATUS
                          </TableHead>
                          <TableHead className="w-[12%] font-semibold text-muted-foreground text-center px-8">
                            DEVOLVER
                          </TableHead>
                          <TableHead className="w-[10%] font-semibold text-muted-foreground text-center px-6">
                            AÇÕES
                          </TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="w-[22%] font-semibold text-muted-foreground text-left px-6">
                            ITEM
                          </TableHead>
                          <TableHead className="w-[18%] font-semibold text-muted-foreground text-left px-6">
                            SOLICITANTE
                          </TableHead>
                          <TableHead className="w-[12%] font-semibold text-muted-foreground text-center px-6">
                            QTD. EMPRESTADA
                          </TableHead>
                          <TableHead className="w-[16%] font-semibold text-muted-foreground text-center px-6">
                            DATA PREVISTA
                          </TableHead>
                          <TableHead className="w-[12%] font-semibold text-muted-foreground text-center px-6">
                            STATUS
                          </TableHead>
                          <TableHead className="w-[10%] font-semibold text-muted-foreground text-center px-8">
                            DEVOLVER
                          </TableHead>
                          <TableHead className="w-[10%] font-semibold text-muted-foreground text-center px-6">
                            AÇÕES
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {emprestimos.map((emp, index) => (
                      <TableRow
                        key={emp._id}
                        data-test={`emprestimo-row-${index}`}
                        onClick={() => {
                          setDetalhesEmprestimo(emp);
                          setIsDetalhesModalOpen(true);
                        }}
                        className="hover:bg-muted border-b cursor-pointer"
                        style={{ height: '60px' }}
                      >
                        {tipoControle === 'unidade' ? (
                          <>
                            <TableCell
                              className="font-medium text-left px-6 py-3 truncate"
                              title={getEmprestimoNome(emp)}
                            >
                              {getEmprestimoNome(emp)}
                            </TableCell>
                            <TableCell
                              className="text-left px-6 py-3 truncate"
                              title={emp.patrimonio?.modelo || '-'}
                            >
                              {emp.patrimonio?.modelo || '-'}
                            </TableCell>
                            <TableCell
                              className="text-left px-6 py-3 truncate"
                              title={emp.solicitante_nome}
                            >
                              {emp.solicitante_nome}
                            </TableCell>
                            <TableCell className="text-center px-6 py-3 whitespace-nowrap">
                              {formatarDataPrevista(
                                emp.data_prevista_devolucao,
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell
                              className="font-medium text-left px-6 py-3 truncate"
                              title={getEmprestimoNome(emp)}
                            >
                              {getEmprestimoNome(emp)}
                            </TableCell>
                            <TableCell
                              className="text-left px-6 py-3 truncate"
                              title={emp.solicitante_nome}
                            >
                              {emp.solicitante_nome}
                            </TableCell>
                            <TableCell className="text-center px-6 py-3">
                              {emp.quantidade_emprestada}
                            </TableCell>
                            <TableCell className="text-center px-6 py-3 whitespace-nowrap">
                              {formatarDataPrevista(
                                emp.data_prevista_devolucao,
                              )}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-center px-6 py-3">
                          <span
                            data-test="status-badge"
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium text-center whitespace-nowrap bg-muted text-muted-foreground"
                            style={
                              emp.status === 'Ativo'
                                ? {
                                    backgroundColor: 'var(--status-success-bg)',
                                    color: 'var(--status-success-text)',
                                  }
                                : emp.status === 'Atrasado'
                                  ? {
                                      backgroundColor:
                                        'var(--status-danger-bg)',
                                      color: 'var(--status-danger-text)',
                                    }
                                  : undefined
                            }
                          >
                            {emp.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-6 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDevolverEmprestimo(emp);
                              setIsDevolverModalOpen(true);
                            }}
                            disabled={emp.quantidade_aberta <= 0}
                            className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                              emp.quantidade_aberta <= 0
                                ? 'border-border text-muted-foreground bg-muted cursor-not-allowed'
                                : 'border-border text-muted-foreground bg-card hover:bg-muted cursor-pointer'
                            }`}
                            data-test="devolver-button"
                          >
                            Devolver
                          </button>
                        </TableCell>
                        <TableCell className="text-center px-8 py-3">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditarEmprestimo(emp);
                                setIsEditarModalOpen(true);
                              }}
                              className="p-1 sm:p-2 rounded-md transition-colors duration-200 text-muted-foreground hover:text-[var(--ei-accent)] hover:bg-[var(--ei-accent)]/10 cursor-pointer"
                              title="Editar empréstimo"
                              data-test="editar-button"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExcluirEmprestimo(emp);
                                setIsExcluirModalOpen(true);
                              }}
                              className="p-1 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir empréstimo"
                              data-test="excluir-button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                <div
                  ref={observerTarget}
                  className="h-10 flex items-center justify-center"
                  data-test="infinite-scroll-sentinel"
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
                icon={Handshake}
                title={
                  searchTerm || statusFilter
                    ? 'Nenhum resultado'
                    : 'Nenhum empréstimo encontrado'
                }
                subtitle={
                  searchTerm || statusFilter
                    ? 'Tente ajustar sua pesquisa ou remover os filtros.'
                    : 'Os empréstimos aparecerão aqui quando forem registrados.'
                }
              />
            </div>
          )}
        </div>
      </div>

      <ModalCadastrarEmprestimo
        isOpen={isCadastrarModalOpen}
        onClose={() => setIsCadastrarModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <ModalSelecionarPatrimonio
        isOpen={isSelecionarPatrimonioModalOpen}
        onClose={() => setIsSelecionarPatrimonioModalOpen(false)}
        onSelect={(patrimonio) => {
          setPatrimonioParaEmprestar(patrimonio);
          setIsSelecionarPatrimonioModalOpen(false);
          setIsEmprestarUnidadeModalOpen(true);
        }}
      />

      {patrimonioParaEmprestar && (
        <ModalEmprestarUnidade
          isOpen={isEmprestarUnidadeModalOpen}
          onClose={() => {
            setIsEmprestarUnidadeModalOpen(false);
            setTimeout(() => setPatrimonioParaEmprestar(null), 300);
          }}
          patrimonio={patrimonioParaEmprestar}
          onSuccess={() => refetch()}
        />
      )}

      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={() => setIsFiltrosModalOpen(false)}
        categoriaFilter=""
        statusFilter={statusFilter}
        onFiltersChange={(_categoria, status) => setStatusFilter(status)}
        statusOptions={statusOptions}
        showCategoria={false}
      />

      {detalhesEmprestimo && (
        <ModalDetalhesEmprestimo
          isOpen={isDetalhesModalOpen}
          onClose={() => {
            setIsDetalhesModalOpen(false);
            setTimeout(() => setDetalhesEmprestimo(null), 300);
          }}
          emprestimo={detalhesEmprestimo}
        />
      )}

      {editarEmprestimo && (
        <ModalEditarEmprestimo
          isOpen={isEditarModalOpen}
          onClose={() => {
            setIsEditarModalOpen(false);
            setTimeout(() => setEditarEmprestimo(null), 300);
          }}
          emprestimo={editarEmprestimo}
          onSuccess={() => refetch()}
        />
      )}

      {devolverEmprestimo && (
        <ModalDevolverItem
          isOpen={isDevolverModalOpen}
          onClose={() => {
            setIsDevolverModalOpen(false);
            setTimeout(() => setDevolverEmprestimo(null), 300);
          }}
          emprestimoId={devolverEmprestimo._id}
          itemNome={getEmprestimoNome(devolverEmprestimo)}
          quantidadeAberta={devolverEmprestimo.quantidade_aberta}
          onSuccess={() => refetch()}
        />
      )}

      {excluirEmprestimo && (
        <ModalExcluirEmprestimo
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setTimeout(() => setExcluirEmprestimo(null), 300);
          }}
          emprestimoId={excluirEmprestimo._id}
          itemNome={getEmprestimoNome(excluirEmprestimo)}
          solicitanteNome={excluirEmprestimo.solicitante_nome}
          onSuccess={() => refetch()}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />
    </div>
  );
}
