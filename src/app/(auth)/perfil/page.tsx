'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Camera, User, Eye, EyeOff, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Cabecalho from '@/components/layout/cabecalho';
import { useSession } from '@/hooks/use-session';
import { authClient } from '@/lib/auth-client';
import { get, patch } from '@/lib/fetchData';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { alterarSenhaSchema, type AlterarSenhaFormData } from '@/schemas';

interface PasswordRequirement {
  text: string;
  regex: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
  { text: 'Mínimo de 8 caracteres', regex: /.{8,}/ },
  { text: 'Uma letra maiúscula', regex: /[A-Z]/ },
  { text: 'Uma letra minúscula', regex: /[a-z]/ },
  { text: 'Um número', regex: /\d/ },
  {
    text: 'Um caractere especial (@, #, $, %, etc.)',
    regex: /[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  },
];

interface UsuarioData {
  _id: string;
  nome: string;
  email: string;
  ativo: boolean;
  convidadoEm?: string;
  ativadoEm?: string;
  fotoPerfil?: string;
  createdAt?: string;
}

interface UsuarioApiResponse {
  error: boolean;
  message: string;
  data: UsuarioData;
}

interface Notificacao {
  _id: string;
  mensagem: string;
  data_hora: string;
  visualizada: boolean;
  usuario: string;
}

interface NotificacoesApiResponse {
  error: boolean;
  message: string;
  data: {
    docs: Notificacao[];
    totalDocs: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

export default function HomePage() {
  const { user, refetch: refetchSession } = useSession();
  const [isEditingFoto, setIsEditingFoto] = useState(false);
  const [isEditingNome, setIsEditingNome] = useState(false);
  const [isEditingSenha, setIsEditingSenha] = useState(false);
  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [editedNome, setEditedNome] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingNotificacaoId, setLoadingNotificacaoId] = useState<
    string | null
  >(null);
  const [loadingAction, setLoadingAction] = useState<
    'visualizar' | 'excluir' | null
  >(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [novaFoto, setNovaFoto] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showSenhaNova, setShowSenhaNova] = useState(false);
  const [showSenhaConfirmar, setShowSenhaConfirmar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [stats, setStats] = useState({
    totalItens: 0,
    totalMovimentacoes: 0,
  });

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await get<UsuarioApiResponse>(`/usuarios/${user.id}`);
        setUserData(response.data);
        setEditedNome(response.data.nome);
        if (response.data.fotoPerfil) {
          setImagemPreview(response.data.fotoPerfil);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [user?.id]);

  const uploadFotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user?.id}/foto`,
        {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        },
      );
      return await response.json();
    },
    onSuccess: async (data: any) => {
      if (data?.data?.fotoPerfil) {
        setImagemPreview(data.data.fotoPerfil);
        if (userData) {
          setUserData({ ...userData, fotoPerfil: data.data.fotoPerfil });
        }
        window.dispatchEvent(new Event('userFotoUpdated'));
      }
      queryClient.invalidateQueries({ queryKey: ['usuario', user?.id] });
      await refetchSession();
      toast.success('Foto atualizada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        transition: Slide,
      });
      setIsEditingFoto(false);
      setNovaFoto(null);
    },
    onError: (error: any) => {
      console.error('Erro ao enviar foto:', error);
      toast.error('Erro ao atualizar foto do perfil', {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      });
    },
  });

  const deleteFotoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user?.id}/foto`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      return await response.json();
    },
    onSuccess: async () => {
      setImagemPreview(null);
      if (userData) {
        setUserData({ ...userData, fotoPerfil: undefined });
      }
      window.dispatchEvent(new Event('userFotoUpdated'));
      queryClient.invalidateQueries({ queryKey: ['usuario', user?.id] });
      await refetchSession();
      toast.success('Foto removida com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        transition: Slide,
      });
      setIsEditingFoto(false);
      setNovaFoto(null);
    },
    onError: (error: any) => {
      console.error('Erro ao deletar foto:', error);
      toast.error('Erro ao remover foto do perfil', {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      });
    },
  });

  const {
    register: registerSenha,
    handleSubmit: handleSubmitSenha,
    watch: watchSenha,
    reset: resetSenhaForm,
    formState: { errors: senhaErrors },
  } = useForm<AlterarSenhaFormData>({
    resolver: zodResolver(alterarSenhaSchema),
  });

  const novaSenhaDigitada = watchSenha('senha', '');

  const alterarSenhaMutation = useMutation({
    mutationFn: async (data: AlterarSenhaFormData) => {
      const { error } = await authClient.changePassword({
        currentPassword: data.senhaAtual,
        newPassword: data.senha,
        revokeOtherSessions: false,
      });
      if (error) throw new Error(error.message ?? 'Erro ao alterar senha');
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        transition: Slide,
      });
      resetSenhaForm();
      setIsEditingSenha(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar senha', {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      });
    },
  });

  const onSubmitSenha = (data: AlterarSenhaFormData) => {
    alterarSenhaMutation.mutate(data);
  };

  const handleCancelarEdicaoSenha = () => {
    resetSenhaForm();
    setShowSenhaAtual(false);
    setShowSenhaNova(false);
    setShowSenhaConfirmar(false);
    setIsEditingSenha(false);
  };

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;

      setIsLoadingStats(true);
      try {
        // Buscar itens do usuário
        const itensResponse = await get<any>('/itens?limite=100');
        const itensDoUsuario =
          itensResponse.data?.docs?.filter((comp: any) => {
            const compUsuarioId = comp.usuario?._id || comp.usuario;
            return (
              compUsuarioId === user.id ||
              String(compUsuarioId) === String(user.id)
            );
          }) || [];
        const totalItens = itensDoUsuario.length;

        // Buscar movimentações do usuário
        const movimentacoesResponse = await get<any>(
          '/movimentacoes?limite=100',
        );
        const movimentacoesDoUsuario =
          movimentacoesResponse.data?.docs?.filter((mov: any) => {
            const movUsuarioId = mov.usuario?._id || mov.usuario;
            return (
              movUsuarioId === user.id ||
              String(movUsuarioId) === String(user.id)
            );
          }) || [];
        const totalMovimentacoes = movimentacoesDoUsuario.length;

        setStats({
          totalItens,
          totalMovimentacoes,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchStats();
  }, [user?.id]);

  const {
    data: notificacoesData,
    isLoading: isLoadingNotificacoes,
    fetchNextPage: fetchNextNotificacoes,
    hasNextPage: hasNextNotificacoes,
    isFetchingNextPage: isFetchingNextNotificacoes,
  } = useInfiniteQuery<NotificacoesApiResponse>({
    queryKey: ['notificacoes', user?.id],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      return await get<NotificacoesApiResponse>(
        `/notificacoes?limite=10&page=${page}`,
      );
    },
    getNextPageParam: (lastPage) => {
      const data = lastPage.data || lastPage;
      return data.hasNextPage ? data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: !!user?.id,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const notificacoes =
    notificacoesData?.pages.flatMap((page) => {
      const data = page.data || page;
      return data.docs || [];
    }) || [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextNotificacoes &&
          !isFetchingNextNotificacoes
        ) {
          fetchNextNotificacoes();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextNotificacoes, isFetchingNextNotificacoes, fetchNextNotificacoes]);

  async function marcarComoVisualizada(notificacaoId: string) {
    setLoadingNotificacaoId(notificacaoId);
    setLoadingAction('visualizar');
    try {
      await patch(`/notificacoes/${notificacaoId}/visualizar`, {});
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
      toast.success('Notificação marcada como lida!', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como visualizada:', error);
      toast.error('Erro ao marcar notificação como lida', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } finally {
      setLoadingNotificacaoId(null);
      setLoadingAction(null);
    }
  }

  async function excluirNotificacao(
    notificacaoId: string,
    event: React.MouseEvent,
  ) {
    event.stopPropagation();
    setLoadingNotificacaoId(notificacaoId);
    setLoadingAction('excluir');
    try {
      await patch(`/notificacoes/${notificacaoId}/inativar`, {});
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
      toast.success('Notificação excluída!', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } finally {
      setLoadingNotificacaoId(null);
      setLoadingAction(null);
    }
  }

  async function marcarTodasComoVisualizadas() {
    const naoVisualizadas = notificacoes.filter((n) => !n.visualizada);

    if (naoVisualizadas.length === 0) {
      toast.info('Todas as notificações já foram lidas', {
        position: 'bottom-right',
        autoClose: 2000,
      });
      return;
    }

    try {
      // Marcar todas as não visualizadas
      await Promise.all(
        naoVisualizadas.map((notif) =>
          patch(`/notificacoes/${notif._id}/visualizar`, {}),
        ),
      );

      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
      toast.success(
        `${naoVisualizadas.length} notificação${naoVisualizadas.length > 1 ? 'ões' : ''} marcada${naoVisualizadas.length > 1 ? 's' : ''} como lida${naoVisualizadas.length > 1 ? 's' : ''}`,
        {
          position: 'bottom-right',
          autoClose: 2000,
        },
      );
    } catch (error) {
      console.error('Erro ao marcar todas como visualizadas:', error);
      toast.error('Erro ao marcar notificações como lidas', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  }

  function formatTempoRelativo(data: string) {
    const dataNotificacao = new Date(data);
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataNotificacao.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / 60000);
    const diferencaHoras = Math.floor(diferencaMinutos / 60);
    const diferencaDias = Math.floor(diferencaHoras / 24);

    if (diferencaMinutos < 1) return 'Agora';
    if (diferencaMinutos < 60) {
      return `Há ${diferencaMinutos} minuto${diferencaMinutos > 1 ? 's' : ''}`;
    }
    if (diferencaHoras < 24) {
      return `Há ${diferencaHoras} hora${diferencaHoras > 1 ? 's' : ''}`;
    }
    if (diferencaDias === 1) return 'Ontem';
    if (diferencaDias < 7) return `Há ${diferencaDias} dias`;
    if (diferencaDias < 30) {
      return `Há ${Math.floor(diferencaDias / 7)} semana${Math.floor(diferencaDias / 7) > 1 ? 's' : ''}`;
    }
    return `Há ${Math.floor(diferencaDias / 30)} mês${Math.floor(diferencaDias / 30) > 1 ? 'es' : ''}`;
  }

  function formatDate(dateString?: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNovaFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setNovaFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagemPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSalvarFoto = () => {
    if (novaFoto) {
      uploadFotoMutation.mutate(novaFoto);
    }
  };

  const handleRemoverFoto = () => {
    setIsConfirmRemoveOpen(true);
  };

  const handleConfirmRemoverFoto = () => {
    deleteFotoMutation.mutate();
    setIsConfirmRemoveOpen(false);
  };

  const handleCancelarEdicaoFoto = () => {
    setIsEditingFoto(false);
    setNovaFoto(null);
    if (userData?.fotoPerfil) {
      setImagemPreview(userData.fotoPerfil);
    } else {
      setImagemPreview(null);
    }
  };

  const handleCancelarEdicaoNome = () => {
    setEditedNome(userData?.nome ?? '');
    setIsEditingNome(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setIsSaving(true);
    try {
      await patch<UsuarioApiResponse>(`/usuarios/${userData._id}`, {
        nome: editedNome,
      });

      setUserData({ ...userData, nome: editedNome });
      setIsEditingNome(false);

      toast.success('Perfil atualizado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        transition: Slide,
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao atualizar perfil', {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="w-full h-screen flex flex-col"
        data-test="loading-perfil-page"
      >
        <Cabecalho pagina="Perfil" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-border/30"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-r-transparent animate-spin"
                style={{
                  borderColor:
                    'var(--ei-accent) transparent transparent transparent',
                }}
              ></div>
            </div>
            <p className="mt-4 text-muted-foreground font-medium">
              Carregando perfil...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="w-full h-screen flex flex-col">
        <Cabecalho pagina="Perfil" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            Erro ao carregar dados do usuário
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col" data-test="perfil-page">
      {/* Cabeçalho */}
      <Cabecalho pagina="Perfil" />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0">
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto pb-2">
          {/* Card resumo da conta */}
          <div
            className="bg-card rounded-md border border-border p-4 flex items-center justify-between gap-4"
            data-test="perfil-conta-card"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-14 h-14 group shrink-0">
                <div
                  className="w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center"
                  data-test="perfil-avatar-container"
                >
                  {imagemPreview ? (
                    <img
                      src={
                        imagemPreview.startsWith('data:')
                          ? imagemPreview
                          : `${imagemPreview}${imagemPreview.includes('?') ? '&' : '?'}t=${Date.now()}`
                      }
                      alt="avatar"
                      className="w-full h-full object-cover"
                      data-test="perfil-avatar"
                    />
                  ) : (
                    <User
                      className="w-7 h-7 text-muted-foreground"
                      data-test="perfil-avatar-placeholder"
                    />
                  )}
                </div>
                <button
                  onClick={() => setIsEditingFoto(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-ei-accent-foreground bg-ei-accent hover:bg-ei-accent-hover transition-colors cursor-pointer"
                  title="Editar foto"
                  data-test="edit-avatar-button"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="min-w-0">
                <h2
                  className="font-semibold text-foreground truncate"
                  title={userData.nome}
                  data-test="perfil-nome"
                >
                  {userData.nome}
                </h2>
                <p
                  className="text-sm text-muted-foreground truncate"
                  title={userData.email}
                  data-test="perfil-email"
                >
                  {userData.email}
                </p>
              </div>
            </div>
          </div>

          {/* Card Informações pessoais */}
          <div
            className="p-6 bg-card rounded-md border border-border"
            data-test="perfil-info-section"
          >
            <h3 className="text-lg font-semibold mb-3 tracking-wide">
              Informações pessoais
            </h3>
            <div className="w-full border-t border-border mb-4"></div>

            {isEditingNome ? (
              <form
                onSubmit={handleSaveEdit}
                className="flex flex-col gap-3"
                data-test="form-editar-nome"
              >
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <Label
                    htmlFor="nome"
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    Nome completo
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    value={editedNome}
                    onChange={(e) => setEditedNome(e.target.value)}
                    maxLength={100}
                    className="h-11"
                    required
                    autoFocus
                    disabled={isSaving}
                    data-test="input-nome"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={
                      isSaving ||
                      !editedNome.trim() ||
                      editedNome.trim() === userData.nome
                    }
                    className="h-11 min-w-20 sm:min-w-[120px] px-4 text-sm font-semibold tracking-tight text-ei-accent-foreground shadow-sm cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: 'var(--ei-accent)' }}
                    data-test="save-perfil-button"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelarEdicaoNome}
                    disabled={isSaving}
                    className="h-11 min-w-20 sm:min-w-[120px] px-4 text-sm font-semibold tracking-tight border-border bg-card text-foreground hover:bg-muted/60 cursor-pointer"
                    data-test="cancel-edit-perfil-button"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-1.5 max-w-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Nome completo
                </p>
                <div className="flex items-center gap-2 min-w-0">
                  <p
                    className="text-sm font-medium text-foreground truncate"
                    title={userData.nome}
                    data-test="perfil-nome-valor"
                  >
                    {userData.nome}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditingNome(true)}
                    className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Editar nome"
                    aria-label="Editar nome"
                    data-test="edit-perfil-button"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-1.5 max-w-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                E-mail
              </p>
              <p
                className="text-sm font-medium text-foreground truncate"
                title={userData.email}
                data-test="perfil-email-readonly"
              >
                {userData.email}
              </p>
              <p className="text-xs text-muted-foreground">
                Alteração de e-mail requer contato com administrador.
              </p>
            </div>

            <div className="mt-6" data-test="perfil-senha-section">
              {isEditingSenha ? (
                <form
                  onSubmit={handleSubmitSenha(onSubmitSenha)}
                  className="flex flex-col gap-4"
                  data-test="alterar-senha-form"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="senhaAtual"
                        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                      >
                        Senha atual
                      </Label>
                      <div className="relative w-full">
                        <Input
                          id="senhaAtual"
                          type={showSenhaAtual ? 'text' : 'password'}
                          aria-invalid={!!senhaErrors.senhaAtual}
                          className="h-11 pr-11"
                          placeholder="••••••••"
                          disabled={alterarSenhaMutation.isPending}
                          autoComplete="current-password"
                          autoFocus
                          data-test="input-senha-atual"
                          {...registerSenha('senhaAtual')}
                        />
                        <button
                          type="button"
                          aria-label={
                            showSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'
                          }
                          onClick={() => setShowSenhaAtual((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {showSenhaAtual ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {senhaErrors.senhaAtual && (
                        <p className="text-xs text-destructive">
                          {senhaErrors.senhaAtual.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="senhaNova"
                        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                      >
                        Nova senha
                      </Label>
                      <div className="relative w-full">
                        <Input
                          id="senhaNova"
                          type={showSenhaNova ? 'text' : 'password'}
                          aria-invalid={!!senhaErrors.senha}
                          className="h-11 pr-11"
                          placeholder="••••••••"
                          disabled={alterarSenhaMutation.isPending}
                          autoComplete="new-password"
                          data-test="input-senha-nova"
                          {...registerSenha('senha')}
                        />
                        <button
                          type="button"
                          aria-label={
                            showSenhaNova ? 'Ocultar senha' : 'Mostrar senha'
                          }
                          onClick={() => setShowSenhaNova((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {showSenhaNova ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {senhaErrors.senha && (
                        <p className="text-xs text-destructive">
                          {senhaErrors.senha.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="senhaConfirmar"
                        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                      >
                        Confirmar nova senha
                      </Label>
                      <div className="relative w-full">
                        <Input
                          id="senhaConfirmar"
                          type={showSenhaConfirmar ? 'text' : 'password'}
                          aria-invalid={!!senhaErrors.confirmarSenha}
                          className="h-11 pr-11"
                          placeholder="••••••••"
                          disabled={alterarSenhaMutation.isPending}
                          autoComplete="new-password"
                          data-test="input-senha-confirmar"
                          {...registerSenha('confirmarSenha')}
                        />
                        <button
                          type="button"
                          aria-label={
                            showSenhaConfirmar
                              ? 'Ocultar senha'
                              : 'Mostrar senha'
                          }
                          onClick={() => setShowSenhaConfirmar((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {showSenhaConfirmar ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {senhaErrors.confirmarSenha && (
                        <p className="text-xs text-destructive">
                          {senhaErrors.confirmarSenha.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {novaSenhaDigitada && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 max-w-2xl">
                      {passwordRequirements.map((req, i) => {
                        const met = req.regex.test(novaSenhaDigitada);
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 text-xs transition-colors duration-150 ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                          >
                            <div
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${met ? 'bg-emerald-500' : 'bg-border'}`}
                            />
                            {req.text}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={alterarSenhaMutation.isPending}
                      className="h-11 min-w-20 sm:min-w-[120px] px-4 text-sm font-semibold tracking-tight text-ei-accent-foreground shadow-sm cursor-pointer hover:opacity-95"
                      style={{ backgroundColor: 'var(--ei-accent)' }}
                      data-test="save-senha-button"
                    >
                      {alterarSenhaMutation.isPending
                        ? 'Salvando...'
                        : 'Salvar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelarEdicaoSenha}
                      disabled={alterarSenhaMutation.isPending}
                      className="h-11 min-w-20 sm:min-w-[120px] px-4 text-sm font-semibold tracking-tight border-border bg-card text-foreground hover:bg-muted/60 cursor-pointer"
                      data-test="cancel-edit-senha-button"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Senha
                  </p>
                  <div className="flex items-center gap-2 min-w-0">
                    <p
                      className="text-sm font-medium text-foreground tracking-widest"
                      data-test="perfil-senha-mascarada"
                    >
                      ••••••••
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingSenha(true)}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Alterar senha"
                      aria-label="Alterar senha"
                      data-test="edit-senha-button"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-1.5 max-w-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Membro desde
              </p>
              <p
                className="text-sm font-medium text-foreground"
                data-test="perfil-membro-desde"
              >
                {formatDate(
                  userData.ativadoEm ??
                    userData.convidadoEm ??
                    userData.createdAt,
                )}
              </p>
            </div>
          </div>

          {/* Estatísticas de uso */}
          <div
            className="p-6 bg-card rounded-md border border-border flex flex-col w-full"
            data-test="estatisticas-section"
          >
            <h3 className="text-lg font-semibold mb-3 tracking-wide">
              Estatísticas de uso
            </h3>
            <div className="w-full border-t border-border mb-4"></div>

            {isLoadingStats ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border flex-1"
                data-test="loading-estatisticas"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col justify-center px-6 py-8 gap-3 animate-pulse"
                  >
                    <div className="h-3 bg-muted-foreground/20 rounded-md w-24"></div>
                    <div className="h-9 bg-muted-foreground/20 rounded-md w-16"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border flex-1">
                <div
                  className="flex flex-col justify-center px-6 py-8 gap-1"
                  data-test="card-total-itens"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ei-stat-title leading-none">
                    Itens cadastrados
                  </p>
                  <p
                    className="text-[2rem] font-extrabold leading-none tracking-tight tabular-nums text-ei-stat-value"
                    title={stats.totalItens.toString()}
                    data-test="total-itens-value"
                  >
                    {stats.totalItens}
                  </p>
                </div>

                <div
                  className="flex flex-col justify-center px-6 py-8 gap-1"
                  data-test="card-total-movimentacoes"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ei-stat-title leading-none">
                    Movimentações
                  </p>
                  <p
                    className="text-[2rem] font-extrabold leading-none tracking-tight tabular-nums text-ei-stat-value"
                    title={stats.totalMovimentacoes.toString()}
                    data-test="total-movimentacoes-value"
                  >
                    {stats.totalMovimentacoes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notificações */}
          <div
            className="p-6 bg-card rounded-md border border-border w-full"
            data-test="notificacoes-section"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-wide">
                  Notificações
                </h3>
                {notificacoes.filter((n) => !n.visualizada).length > 0 && (
                  <span
                    className="text-base text-ei-accent font-medium"
                    data-test="notificacoes-nao-lidas-count"
                  >
                    ({notificacoes.filter((n) => !n.visualizada).length})
                  </span>
                )}
              </div>
              {notificacoes.filter((n) => !n.visualizada).length > 0 && (
                <button
                  onClick={marcarTodasComoVisualizadas}
                  className="text-sm text-ei-accent hover:text-ei-accent/80 hover:underline transition-colors cursor-pointer"
                  data-test="marcar-todas-lidas-button"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="w-full border-t border-border"></div>

            <div className="max-h-60 overflow-y-auto">
              {isLoadingNotificacoes ? (
                <div
                  className="divide-y divide-border w-full"
                  data-test="loading-notificacoes"
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-3 py-3 animate-pulse">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full shrink-0 mt-1.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded-md w-3/4"></div>
                          <div className="h-3 bg-muted rounded-md w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notificacoes.length > 0 ? (
                <div
                  className="divide-y divide-border w-full"
                  data-test="notificacoes-list"
                >
                  {notificacoes.map((notificacao) => {
                    const isLoadingThis =
                      loadingNotificacaoId === notificacao._id;
                    const loadingMessage = isLoadingThis
                      ? loadingAction === 'excluir'
                        ? 'Excluindo...'
                        : 'Marcando como lida...'
                      : notificacao.mensagem;
                    return (
                      <div
                        key={notificacao._id}
                        className={`px-3 py-3 ${notificacao.visualizada ? 'bg-card' : 'bg-muted/30'} ${isLoadingThis ? 'opacity-50 cursor-wait' : ''} transition-colors hover:bg-muted/50 group`}
                        data-test={`notificacao-item-${notificacao._id}`}
                      >
                        <div className="flex items-start gap-2">
                          {!notificacao.visualizada && (
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                              style={{ backgroundColor: 'var(--ei-accent)' }}
                              data-test="notificacao-nao-lida-indicator"
                            ></div>
                          )}
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() =>
                              !notificacao.visualizada &&
                              !isLoadingThis &&
                              marcarComoVisualizada(notificacao._id)
                            }
                            data-test="notificacao-marcar-lida-area"
                          >
                            <p
                              className={`text-sm text-foreground ${notificacao.visualizada ? '' : 'font-medium'}`}
                              data-test="notificacao-mensagem"
                            >
                              {loadingMessage}
                              {!isLoadingThis && (
                                <span
                                  className="text-sm text-muted-foreground font-normal ml-2"
                                  data-test="notificacao-tempo-relativo"
                                >
                                  - {formatTempoRelativo(notificacao.data_hora)}
                                </span>
                              )}
                            </p>
                          </div>
                          {!isLoadingThis && (
                            <button
                              onClick={(e) =>
                                excluirNotificacao(notificacao._id, e)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md cursor-pointer"
                              title="Excluir notificação"
                              data-test="notificacao-excluir-button"
                            >
                              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={observerTarget} className="h-2" />
                  {isFetchingNextNotificacoes && (
                    <div
                      className="px-3 py-3 text-center"
                      data-test="loading-more-notificacoes"
                    >
                      <p className="text-sm text-muted-foreground">
                        Carregando mais...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center w-full py-12 gap-2"
                  data-test="no-notificacoes-message"
                >
                  <p className="text-sm font-medium text-foreground">
                    Tudo em dia
                  </p>
                  <p className="text-xs text-muted-foreground text-center max-w-60">
                    Novas notificações sobre estoque e atividades aparecerão
                    aqui.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edição de foto */}
      {isEditingFoto && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={handleCancelarEdicaoFoto}
          data-test="modal-edit-foto"
        >
          <div
            className="bg-card rounded-md border border-border shadow-none max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de fechar */}
            <div className="relative p-6 pb-0">
              <button
                onClick={handleCancelarEdicaoFoto}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                title="Fechar"
                data-test="modal-edit-foto-close-button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center pt-4 px-8">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Editar foto do perfil
                </h2>
              </div>

              {/* Preview da foto */}
              <div className="flex justify-center">
                <div
                  className="w-40 h-40 rounded-full overflow-hidden bg-muted flex items-center justify-center"
                  data-test="foto-preview-container"
                >
                  {imagemPreview ? (
                    <img
                      src={
                        imagemPreview.startsWith('data:')
                          ? imagemPreview
                          : `${imagemPreview}${imagemPreview.includes('?') ? '&' : '?'}t=${Date.now()}`
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                      data-test="foto-preview-image"
                    />
                  ) : (
                    <User
                      className="w-20 h-20 text-muted-foreground"
                      data-test="foto-preview-placeholder"
                    />
                  )}
                </div>
              </div>

              {/* Upload de nova foto */}
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-ei-accent bg-ei-accent/5'
                      : 'border-border bg-muted/50 hover:bg-muted hover:border-muted-foreground/40'
                  }`}
                  data-test="foto-upload-area"
                >
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-center text-sm">
                    <span className="font-semibold text-ei-accent">
                      Selecione uma nova foto
                    </span>{' '}
                    <span className="text-muted-foreground">
                      ou arraste aqui
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG ou JPEG até 5MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                  data-test="foto-file-input"
                />
              </div>
            </div>

            {/* Footer com ações */}
            <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelarEdicaoFoto}
                  disabled={
                    uploadFotoMutation.isPending || deleteFotoMutation.isPending
                  }
                  className="h-11 flex-1 cursor-pointer"
                  data-test="cancel-edit-foto-button"
                >
                  Cancelar
                </Button>
                {imagemPreview && !novaFoto && (
                  <Button
                    onClick={handleRemoverFoto}
                    disabled={deleteFotoMutation.isPending}
                    className="h-11 flex-1 bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
                    data-test="remove-foto-button"
                  >
                    {deleteFotoMutation.isPending
                      ? 'Removendo...'
                      : 'Remover foto'}
                  </Button>
                )}
                {novaFoto && (
                  <Button
                    onClick={handleSalvarFoto}
                    disabled={uploadFotoMutation.isPending}
                    className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: 'var(--ei-accent)' }}
                    data-test="save-foto-button"
                  >
                    {uploadFotoMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Remover Foto */}
      {isConfirmRemoveOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => setIsConfirmRemoveOpen(false)}
          data-test="modal-confirm-remove-foto"
        >
          <div
            className="bg-card rounded-md border border-border shadow-none max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            {/* Botão de fechar */}
            <div className="relative p-6 pb-0">
              <button
                onClick={() => setIsConfirmRemoveOpen(false)}
                disabled={deleteFotoMutation.isPending}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Fechar"
                data-test="modal-confirm-remove-foto-close-button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center pt-4 px-8">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Remover foto de perfil
                </h2>
                <div className="max-h-[120px] overflow-y-auto">
                  <p className="text-muted-foreground wrap-break-word">
                    Tem certeza que deseja remover sua foto de perfil? Esta ação
                    não pode ser desfeita.
                  </p>
                </div>
              </div>

              {/* Mensagem de erro da API */}
              {deleteFotoMutation.error && (
                <div
                  className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive"
                  data-test="remove-foto-error-message"
                >
                  <div className="font-medium mb-1">
                    Não foi possível remover a foto
                  </div>
                  <div className="text-destructive/80">
                    {(deleteFotoMutation.error as any)?.response?.data
                      ?.message ||
                      (deleteFotoMutation.error as any)?.message ||
                      'Erro desconhecido'}
                  </div>
                </div>
              )}
            </div>

            {/* Footer com ações */}
            <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmRemoveOpen(false)}
                  disabled={deleteFotoMutation.isPending}
                  className="h-11 flex-1 cursor-pointer"
                  data-test="cancel-remove-foto-button"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmRemoverFoto}
                  disabled={deleteFotoMutation.isPending}
                  className="h-11 flex-1 bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
                  data-test="confirm-remove-foto-button"
                >
                  {deleteFotoMutation.isPending ? 'Removendo...' : 'Remover'}
                </Button>
              </div>
            </div>
          </div>
        </div>
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
