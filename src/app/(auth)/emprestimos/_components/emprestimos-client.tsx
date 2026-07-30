'use client';

import Cabecalho from '@/components/cabecalho';
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
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import StatCard from '@/components/stat-card';
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

  const { data: globalStats } = useQuery<{
    total: number;
    ativos: number;
    atrasados: number;
    devolvidos: number;
  }>({
    queryKey: ['emprestimos-global-stats', searchTerm, statusFilter],
    queryFn: async () => {
      const limit = 500;
      let page = 1;
      let hasNextPage = true;
      const docs: Emprestimo[] = [];

      while (hasNextPage) {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limite', String(limit));

        if (searchTerm) params.append('solicitante_nome', searchTerm);
        if (statusFilter === 'Ativo') params.append('apenas_abertos', 'true');
        if (statusFilter === 'Atrasado') params.append('atrasados', 'true');

        const response = await get<EmprestimosApiResponse>(
          `/emprestimos?${params.toString()}`,
        );

        docs.push(...(response?.data?.docs || []));
        hasNextPage = !!response?.data?.hasNextPage;
        page = response?.data?.nextPage || page + 1;
      }

      const filtrados = docs.filter((emp) => {
        const termo = searchTerm.toLowerCase().trim();

        const matchSearch =
          !termo ||
          emp.solicitante_nome.toLowerCase().includes(termo) ||
          emp.item?.nome?.toLowerCase().includes(termo) ||
          emp.localizacao?.nome?.toLowerCase().includes(termo);

        const matchStatus = !statusFilter || emp.status === statusFilter;
        return matchSearch && matchStatus;
      });

      return {
        total: filtrados.length,
        ativos: filtrados.filter((e) => e.status === 'Ativo').length,
        atrasados: filtrados.filter((e) => e.status === 'Atrasado').length,
        devolvidos: filtrados.filter((e) => e.status === 'Devolvido').length,
      };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const totalLocal = emprestimos.length;
  const ativosLocal = emprestimos.filter((e) => e.status === 'Ativo').length;
  const atrasadosLocal = emprestimos.filter(
    (e) => e.status === 'Atrasado',
  ).length;
  const devolvidosLocal = emprestimos.filter(
    (e) => e.status === 'Devolvido',
  ).length;

  const total = globalStats?.total ?? totalLocal;
  const ativos = globalStats?.ativos ?? ativosLocal;
  const atrasados = globalStats?.atrasados ?? atrasadosLocal;
  const devolvidos = globalStats?.devolvidos ?? devolvidosLocal;

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
        <div className="shrink-0 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard title="Total de empréstimos" value={total} />
            <StatCard title="Ativos" value={ativos} />
            <StatCard title="Atrasados" value={atrasados} />
            <StatCard title="Devolvidos" value={devolvidos} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar por item, solicitante ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[#306FCC]/35 focus-visible:border-[#306FCC]"
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
        </div>

        {statusFilter && (
          <div className="mb-4 shrink-0" data-test="applied-filters">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted text-foreground rounded text-xs border border-border font-medium"
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
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Erro ao carregar empréstimos: {error.message}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Carregando empréstimos...
              </p>
            </div>
          ) : emprestimos.length > 0 ? (
            <div className="border rounded-lg bg-white flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table className="w-full min-w-[700px] caption-bottom text-xs sm:text-sm">
                  <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="font-semibold text-gray-700 text-left px-6">
                        ITEM
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-left px-6">
                        SOLICITANTE
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center px-6">
                        QTD. EMPRESTADA
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center px-6">
                        DATA PREVISTA
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center px-6">
                        STATUS
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center px-6">
                        AÇÕES
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center px-8">
                        DEVOLVER
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {emprestimos.map((emp) => (
                      <TableRow
                        key={emp._id}
                        onClick={() => {
                          setDetalhesEmprestimo(emp);
                          setIsDetalhesModalOpen(true);
                        }}
                        className="hover:bg-gray-50 border-b cursor-pointer"
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
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-[5px] border border-current/30 text-xs font-medium text-center whitespace-nowrap ${
                              emp.status === 'Ativo'
                                ? 'bg-green-100 text-green-800'
                                : emp.status === 'Atrasado'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
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
                              className="p-1 sm:p-2 rounded-md transition-colors duration-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Editar empréstimo"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExcluirEmprestimo(emp);
                                setIsExcluirModalOpen(true);
                              }}
                              className="p-1 sm:p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir empréstimo"
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
                                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
                            }`}
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
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 shrink-0">
                  <span className="text-sm text-gray-500">
                    Página {currentPage} de {paginationInfo.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={!paginationInfo.hasPrevPage}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-card rounded-lg border border-border">
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
            setDetalhesEmprestimo(null);
          }}
          emprestimo={detalhesEmprestimo}
        />
      )}

      {editarEmprestimo && (
        <ModalEditarEmprestimo
          isOpen={isEditarModalOpen}
          onClose={() => {
            setIsEditarModalOpen(false);
            setEditarEmprestimo(null);
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
            setDevolverEmprestimo(null);
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
            setExcluirEmprestimo(null);
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
