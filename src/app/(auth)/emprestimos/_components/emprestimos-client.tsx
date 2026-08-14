'use client';

import Cabecalho from '@/components/cabecalho';
import ModalCadastrarEmprestimo from '@/components/modal-cadastrar-emprestimo';
import ModalDetalhesEmprestimo from '@/components/modal-detalhes-emprestimo';
import ModalEditarEmprestimo from '@/components/modal-editar-emprestimo';
import ModalExcluirEmprestimo from '@/components/modal-excluir-emprestimo';
import ModalDevolverItem from '@/components/modal-devolver-item';
import ModalFiltros from '@/components/modal-filtros';
import EmptyState from '@/components/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { get } from '@/lib/fetchData';
import { EmprestimosApiResponse, Emprestimo } from '@/types/emprestimos';
import {
  Search,
  Handshake,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);

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

  const { data, isLoading, error, refetch } = useQuery<EmprestimosApiResponse>({
    queryKey: ['emprestimos', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limite', '20');

      if (searchTerm) params.append('solicitante_nome', searchTerm);
      if (statusFilter === 'Ativo') params.append('apenas_abertos', 'true');
      if (statusFilter === 'Atrasado') params.append('atrasados', 'true');

      return await get<EmprestimosApiResponse>(
        `/emprestimos?${params.toString()}`,
      );
    },
    refetchOnMount: 'always',
    placeholderData: initialData,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const emprestimos = data?.data?.docs || [];
  const paginationInfo = data?.data;

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

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0">
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
            <Filter className="w-4 h-4" />
            Filtros
          </Button>

          <Button
            className="h-11 px-4 flex items-center gap-2 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="adicionar-button"
            onClick={() => setIsCadastrarModalOpen(true)}
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
                  className="w-full min-w-[700px] caption-bottom text-xs sm:text-sm"
                  data-test="emprestimos-table"
                >
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        ITEM
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-left px-6">
                        SOLICITANTE
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        QTD. EMPRESTADA
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        DATA PREVISTA
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        STATUS
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-6">
                        AÇÕES
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-center px-8">
                        DEVOLVER
                      </TableHead>
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
                        <TableCell className="font-medium text-left px-6 py-3">
                          {emp.item?.nome || '-'}
                        </TableCell>
                        <TableCell className="text-left px-6 py-3">
                          {emp.solicitante_nome}
                        </TableCell>
                        <TableCell className="text-center px-6 py-3">
                          {emp.quantidade_emprestada}
                        </TableCell>
                        <TableCell className="text-center px-6 py-3 whitespace-nowrap">
                          {formatarDataPrevista(emp.data_prevista_devolucao)}
                        </TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
              {paginationInfo && paginationInfo.totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0"
                  data-test="pagination-controls"
                >
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {paginationInfo.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={!paginationInfo.hasPrevPage}
                      className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      data-test="prev-page-button"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(paginationInfo.totalPages, p + 1),
                        )
                      }
                      disabled={!paginationInfo.hasNextPage}
                      className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      data-test="next-page-button"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
          itemNome={devolverEmprestimo.item?.nome || 'Item'}
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
          itemNome={excluirEmprestimo.item?.nome || 'Item'}
          solicitanteNome={excluirEmprestimo.solicitante_nome}
          onSuccess={() => {
            if (emprestimos.length === 1 && currentPage > 1) {
              setCurrentPage((p) => p - 1);
            } else {
              refetch();
            }
          }}
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
