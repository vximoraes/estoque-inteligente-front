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
import { useQuery } from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { Search, Plus, Trash2, Mail, Loader2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalCadastrarUsuario from '@/components/modal-cadastrar-usuario';
import ModalExcluirUsuario from '@/components/modal-excluir-usuario';
import ModalDetalhesUsuario from '@/components/modal-detalhes-usuario';
import { useSession } from '@/hooks/use-session';

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

export default function PageUsuariosContent({ initialData }: { initialData?: UsuarioApiResponse }) {
  const router = useRouter();
  const { user } = useSession();
  const [searchTerm, setSearchTerm] = useQueryState('busca', { defaultValue: '' });
  const [currentPage, setCurrentPage] = useState(1);
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
    isFetching,
    error,
    refetch,
  } = useQuery<UsuarioApiResponse>({
    queryKey: ['usuarios', searchTerm, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      params.append('limite', '20');
      params.append('page', currentPage.toString());

      const queryString = params.toString();
      const url = `/usuarios${queryString ? `?${queryString}` : ''}`;

      return await get<UsuarioApiResponse>(url);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: initialData,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

    const isLastItemOnPage = usuarios.length === 1;
    const shouldGoToPreviousPage = isLastItemOnPage && currentPage > 1;

    toast.success('Usuário excluído com sucesso!', {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      transition: Slide,
    });

    if (shouldGoToPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }

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

  const usuarios = (data?.data?.docs || []).filter(
    (usuario) => usuario._id !== user?.id,
  );
  const paginationInfo = data?.data || {
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      <Cabecalho pagina="Usuários" />

      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0 max-w-full">
        <div
          className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0"
          data-test="search-actions-bar"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              data-test="search-input"
              type="text"
              placeholder="Pesquisar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            data-test="cadastrar-usuario-button"
            className="flex items-center gap-2 text-white hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#306FCC' }}
            onClick={() => setIsCadastrarModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Cadastrar usuário
          </Button>
        </div>

        {error && (
          <div
            data-test="error-message"
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded shrink-0"
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
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Carregando usuários...
              </p>
            </div>
          ) : usuarios.length > 0 ? (
            <div className="border rounded-lg bg-white flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto flex-1 relative">
                <table
                  data-test="usuarios-table"
                  className="w-full min-w-[800px] caption-bottom text-xs sm:text-sm"
                >
                  <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        NOME
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-left px-8">
                        E-MAIL
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-center px-8 whitespace-nowrap">
                        STATUS
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 bg-gray-50 text-center px-8 whitespace-nowrap">
                        AÇÕES
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow
                        key={usuario._id}
                        className="hover:bg-gray-50 border-b relative"
                        style={{ height: '60px' }}
                      >
                        <TableCell className="font-medium text-left px-8 py-2">
                          <span
                            className="truncate block max-w-[200px]"
                            title={usuario.nome}
                          >
                            {usuario.nome}
                          </span>
                        </TableCell>
                        <TableCell className="text-left px-8 py-2">
                          <span
                            className="truncate block max-w-[250px]"
                            title={usuario.email}
                          >
                            {usuario.email}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex justify-center">
                            <span
                              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.07em] whitespace-nowrap"
                              title={usuario.ativo ? 'Usuário ativo' : 'Aguardando ativação'}
                              style={{
                                color: usuario.ativo
                                  ? 'oklch(0.55 0.16 145)'
                                  : 'oklch(0.58 0.14 78)',
                              }}
                            >
                              {usuario.ativo ? 'Ativo' : 'Aguardando ativação'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-8 py-2 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              data-test="visualizar-button"
                              onClick={() => handleViewDetails(usuario._id)}
                              className="p-1 sm:p-2 text-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Ver detalhes do usuário"
                            >
                              <Eye size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            {!usuario.ativo && (
                              <button
                                data-test="reenviar-convite-button"
                                onClick={() =>
                                  handleReenviarConvite(
                                    usuario._id,
                                    usuario.nome,
                                  )
                                }
                                disabled={reenviarConviteId === usuario._id}
                                className="p-1 sm:p-2 text-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reenviar convite"
                              >
                                {reenviarConviteId === usuario._id ? (
                                  <Loader2
                                    size={16}
                                    className="sm:w-5 sm:h-5 animate-spin"
                                  />
                                ) : (
                                  <Mail size={16} className="sm:w-5 sm:h-5" />
                                )}
                              </button>
                            )}
                            <button
                              data-test="excluir-button"
                              onClick={() =>
                                handleExcluirUsuario(usuario._id, usuario.nome)
                              }
                              className="p-1 sm:p-2 text-gray-900 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Excluir usuário"
                            >
                              <Trash2 size={16} className="sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
              {paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 shrink-0">
                  <p className="text-sm text-gray-600">
                    Página {paginationInfo.page} de {paginationInfo.totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={!paginationInfo.hasPrevPage || isFetching}
                      className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={!paginationInfo.hasNextPage || isFetching}
                      className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              data-test="empty-state"
              className="text-center flex-1 flex items-center justify-center bg-white rounded-lg border"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p data-test="empty-message" className="text-gray-500 text-lg">
                  {searchTerm
                    ? 'Nenhum usuário encontrado para sua pesquisa.'
                    : 'Não há usuários cadastrados...'}
                </p>
              </div>
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
            setExcluirUsuarioId(null);
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
            setDetalhesUsuarioId(null);
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
