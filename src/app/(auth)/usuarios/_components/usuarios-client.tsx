'use client';
import Cabecalho from '@/components/layout/cabecalho';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import {
  Search,
  Plus,
  Trash2,
  Mail,
  Loader2,
  Users,
  UserCheck,
} from 'lucide-react';
import EmptyState from '@/components/comum/empty-state';
import OrdenarPorSelect from '@/components/comum/ordenar-por-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ORDENACAO_USUARIOS } from '@/lib/ordenacao';
import { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalCadastrarUsuario from '@/app/(auth)/usuarios/_components/modal-cadastrar-usuario';
import ModalExcluirUsuario from '@/app/(auth)/usuarios/_components/modal-excluir-usuario';
import ModalDetalhesUsuario from '@/app/(auth)/usuarios/_components/modal-detalhes-usuario';
import { useSession } from '@/hooks/use-session';
import { usePermissions } from '@/hooks/use-permissions';
import { PulseLoader } from 'react-spinners';

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  ativo: boolean;
  convidadoEm?: string;
  ativadoEm?: string;
}

interface UsuarioApiResponse {
  error: boolean;
  message: string;
  data: {
    docs: Usuario[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    nextPage: number | null;
  };
}

const STATUS_FILTER_PADRAO = 'todos';

const STATUS_OPTIONS = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Aguardando ativação' },
];

export default function PageUsuariosContent({
  initialData,
}: {
  initialData?: UsuarioApiResponse;
}) {
  const { user } = useSession();
  const { canManageUsers, loading: permissoesLoading } = usePermissions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchTerm, setSearchTerm] = useQueryState('busca', {
    defaultValue: '',
  });
  const [ordenar, setOrdenar] = useQueryState('ordenar', {
    defaultValue: '',
  });
  const [statusFilter, setStatusFilter] = useQueryState('status', {
    defaultValue: '',
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [excluirUsuarioId, setExcluirUsuarioId] = useState<string | null>(null);
  const [excluirUsuarioNome, setExcluirUsuarioNome] = useState<string>('');
  const [isRefetchingAfterDelete, setIsRefetchingAfterDelete] = useState(false);
  const [isCadastrarModalOpen, setIsCadastrarModalOpen] = useState(false);
  const [reenviarConviteId, setReenviarConviteId] = useState<string | null>(
    null,
  );
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [detalhesUsuarioId, setDetalhesUsuarioId] = useState<string | null>(
    null,
  );

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<UsuarioApiResponse>({
    queryKey: ['usuarios', searchTerm, ordenar, statusFilter],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      if (ordenar) params.append('ordenar', ordenar);
      if (statusFilter) params.append('ativo', statusFilter);
      params.append('limite', '20');
      params.append('page', page.toString());

      const queryString = params.toString();
      const url = `/usuarios${queryString ? `?${queryString}` : ''}`;

      return await get<UsuarioApiResponse>(url);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !permissoesLoading && canManageUsers(),
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

  const handleCadastrarSuccess = async () => {
    setIsRefetchingAfterDelete(true);
    await refetch();
    setIsRefetchingAfterDelete(false);
  };

  const handleExcluirUsuario = (id: string, nome: string) => {
    setExcluirUsuarioId(id);
    setExcluirUsuarioNome(nome);
    setIsExcluirModalOpen(true);
  };

  const handleExcluirSuccess = async () => {
    setIsRefetchingAfterDelete(true);

    toast.success('Usuário excluído com sucesso!', {
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

  const handleReenviarConvite = async (id: string, nome: string) => {
    setReenviarConviteId(id);
    try {
      await post(`/usuarios/${id}/reenviar-convite`, {});

      toast.success(`Convite reenviado para ${nome}!`, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });

      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao reenviar convite', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
    } finally {
      setReenviarConviteId(null);
    }
  };

  const handleViewDetails = (id: string) => {
    setDetalhesUsuarioId(id);
    setIsDetalhesModalOpen(true);
  };

  const usuarios = (data?.pages.flatMap((page) => page.data.docs) || []).filter(
    (usuario) => !mounted || usuario._id !== user?.id,
  );

  if (permissoesLoading) {
    return null;
  }

  if (!canManageUsers()) {
    notFound();
  }

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      <Cabecalho pagina="Usuários" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-1 max-w-full">
        <div
          className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              data-test="search-input"
              type="text"
              placeholder="Pesquisar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <OrdenarPorSelect
            value={ordenar}
            onChange={setOrdenar}
            opcoes={ORDENACAO_USUARIOS}
          />
          <Select
            value={statusFilter || STATUS_FILTER_PADRAO}
            onValueChange={(novoValor) =>
              setStatusFilter(
                novoValor === STATUS_FILTER_PADRAO ? '' : novoValor,
              )
            }
          >
            <SelectTrigger
              className="h-11 max-w-[220px] shrink-0 bg-background/30 dark:bg-input/30"
              data-test="status-filter-select"
              aria-label="Filtrar por status"
            >
              <UserCheck className="w-4 h-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={STATUS_FILTER_PADRAO}>
                Todos os status
              </SelectItem>
              {STATUS_OPTIONS.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            data-test="cadastrar-usuario-button"
            className="h-11 flex items-center gap-2 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            onClick={() => setIsCadastrarModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {error && (
          <div
            data-test="error-message"
            className="mb-4 p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-md shrink-0"
          >
            Erro ao carregar usuários: {error.message}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading || isRefetchingAfterDelete ? (
            <div
              data-test="loading-state"
              className="flex flex-col items-center justify-center flex-1"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">
                Carregando usuários...
              </p>
            </div>
          ) : usuarios.length > 0 ? (
            <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  data-test="usuarios-table"
                  className="w-full min-w-[800px] table-fixed caption-bottom text-xs sm:text-sm"
                >
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                    <col className="w-[35%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                    <TableRow className="bg-muted border-b">
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        NOME
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-left px-8">
                        E-MAIL
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-center px-8 whitespace-nowrap">
                        STATUS
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground bg-muted text-center px-8 whitespace-nowrap">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow
                        key={usuario._id}
                        data-test="visualizar-button"
                        onClick={() => handleViewDetails(usuario._id)}
                        className="hover:bg-muted border-b relative cursor-pointer"
                        style={{ height: '60px' }}
                      >
                        <TableCell className="font-medium text-left px-8 py-2">
                          <span className="truncate block" title={usuario.nome}>
                            {usuario.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-left px-8 py-2">
                          <span
                            className="truncate block"
                            title={usuario.email}
                          >
                            {usuario.email}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex justify-center">
                            <span
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium whitespace-nowrap"
                              title={
                                usuario.ativo
                                  ? 'Usuário ativo'
                                  : 'Aguardando ativação'
                              }
                              style={{
                                color: usuario.ativo
                                  ? 'var(--status-success-text)'
                                  : 'var(--status-warning-text)',
                                backgroundColor: usuario.ativo
                                  ? 'var(--status-success-bg)'
                                  : 'var(--status-warning-bg)',
                              }}
                            >
                              {usuario.ativo ? 'Ativo' : 'Aguardando ativação'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              data-test="reenviar-convite-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (usuario.ativo) return;
                                handleReenviarConvite(
                                  usuario._id,
                                  usuario.nome,
                                );
                              }}
                              disabled={
                                usuario.ativo ||
                                reenviarConviteId === usuario._id
                              }
                              className="p-1 sm:p-2 text-foreground hover:text-[var(--ei-accent)] hover:bg-[var(--ei-accent)]/10 rounded-md transition-colors duration-200 cursor-pointer disabled:text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                              title={
                                usuario.ativo
                                  ? 'Usuário já ativo'
                                  : 'Reenviar convite'
                              }
                            >
                              {reenviarConviteId === usuario._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              data-test="excluir-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirUsuario(usuario._id, usuario.nome);
                              }}
                              className="p-1 sm:p-2 text-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir usuário"
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
                icon={Users}
                title={
                  searchTerm || statusFilter
                    ? 'Nenhum resultado'
                    : 'Nenhum usuário cadastrado'
                }
                subtitle={
                  searchTerm || statusFilter
                    ? 'Tente ajustar sua pesquisa ou filtros.'
                    : 'Comece adicionando o primeiro usuário.'
                }
              />
            </div>
          )}
        </div>
      </div>

      <ModalCadastrarUsuario
        isOpen={isCadastrarModalOpen}
        onClose={() => setIsCadastrarModalOpen(false)}
        onSuccess={handleCadastrarSuccess}
      />

      {excluirUsuarioId && (
        <ModalExcluirUsuario
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false);
            setTimeout(() => setExcluirUsuarioId(null), 300);
          }}
          onSuccess={handleExcluirSuccess}
          usuarioId={excluirUsuarioId}
          usuarioNome={excluirUsuarioNome}
        />
      )}

      {detalhesUsuarioId && (
        <ModalDetalhesUsuario
          isOpen={isDetalhesModalOpen}
          onClose={() => {
            setIsDetalhesModalOpen(false);
            setTimeout(() => setDetalhesUsuarioId(null), 300);
          }}
          usuarioId={detalhesUsuarioId}
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
