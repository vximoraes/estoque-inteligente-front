'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { Bell, Menu, ChevronLeft } from 'lucide-react';
import { get, patch } from '@/lib/fetchData';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type NotificationItem = {
  _id: string;
  mensagem: string;
  data_hora: string;
  visualizada: boolean;
  usuario: string;
};

interface NotificacoesApiResponse {
  error: boolean;
  message: string;
  data: {
    docs: NotificationItem[];
    totalDocs: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

export interface CabecalhoProps {
  pagina: string;
  acao?: string;
  descricao?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Cabecalho({
  pagina,
  acao,
  descricao,
  showBackButton,
  onBackClick,
}: CabecalhoProps) {
  const router = useRouter();
  const { user } = useSession();
  const { toggleSidebar } = useSidebarContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const [sseConnected, setSSEConnected] = useState(false);

  const { data: notificacoesData } = useQuery<NotificacoesApiResponse>({
    queryKey: ['notificacoes-header', user?.id],
    queryFn: async () =>
      await get<NotificacoesApiResponse>('/notificacoes?limite=5&page=1'),
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchInterval: sseConnected ? false : 15000,
  });

  const notifications = notificacoesData?.data?.docs || [];

  useEffect(() => {
    if (!user?.id) return;

    let abortController: AbortController | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectSSE = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) return;

      abortController = new AbortController();

      const url = `${API_URL}/notificacoes/stream`;

      try {
        const response = await fetch(url, {
          headers: { Accept: 'text/event-stream' },
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          scheduleReconnect();
          return;
        }

        setSSEConnected(true);
        reconnectAttempts = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setSSEConnected(false);
            scheduleReconnect();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            if (!event.trim()) continue;

            const lines = event.split('\n');
            let eventType = '';
            let eventData = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                eventData = line.slice(5).trim();
              }
            }

            if (eventType && eventData) {
              if (eventType === 'notificacao') {
                queryClient.invalidateQueries({
                  queryKey: ['notificacoes-header', user?.id],
                });
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSSEConnected(false);
          scheduleReconnect();
        }
      }
    };

    const scheduleReconnect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        return;
      }

      const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;

      reconnectTimeout = setTimeout(connectSSE, delay);
    };

    connectSSE();

    return () => {
      if (abortController) {
        abortController.abort();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      setSSEConnected(false);
    };
  }, [user?.id, queryClient]);

  const handleNotificationsClick = () => setShowNotifications((prev) => !prev);
  const handleProfileClick = () => router.push('/perfil');
  const handleMenuClick = () => toggleSidebar();

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  async function markAsRead(id?: string) {
    if (id) {
      try {
        await patch(`/notificacoes/${id}/visualizar`, {});
        queryClient.invalidateQueries({
          queryKey: ['notificacoes-header', user?.id],
        });
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    } else {
      try {
        await patch(`/notificacoes/visualizar-todas`, {});
        queryClient.invalidateQueries({
          queryKey: ['notificacoes-header', user?.id],
        });
      } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
      }
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
    if (diferencaMinutos < 60) return `Há ${diferencaMinutos} min`;
    if (diferencaHoras < 24) return `Há ${diferencaHoras}h`;
    if (diferencaDias === 1) return 'Ontem';
    if (diferencaDias < 7) return `Há ${diferencaDias}d`;
    return new Date(data).toLocaleDateString('pt-BR');
  }

  return (
    <div className="flex justify-between w-full px-6 md:px-6 pt-[30px] md:pt-10 pb-2.5 md:pb-5">
      <div className="flex items-center gap-3 md:gap-5">
        <button
          onClick={handleMenuClick}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6 text-foreground" strokeWidth={2} />
        </button>

        {showBackButton && onBackClick && (
          <button
            onClick={onBackClick}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors cursor-pointer"
            aria-label="Voltar"
            title="Voltar"
          >
            <ChevronLeft
              className="w-5 h-5 md:w-6 md:h-6 text-foreground"
              strokeWidth={2}
            />
          </button>
        )}

        <h1 className="text-[18px] md:text-[20px] font-bold text-foreground">
          {pagina}
          {acao && (
            <span className="text-muted-foreground font-semibold ml-2">
              &gt; {acao}
            </span>
          )}
        </h1>
        {descricao && (
          <span className="text-[14px] md:text-[16px] text-muted-foreground font-medium hidden sm:inline">
            {descricao}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 md:gap-3.5">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleNotificationsClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
            aria-label="Notificações"
            data-test="botao-notificacoes"
          >
            <Bell
              className="w-[22px] h-[22px] text-foreground"
              strokeWidth={2.3}
            />
            {notifications.some((n) => !n.visualizada) && (
              <span
                className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-card"
                data-test="contador-notificacoes"
              >
                {notifications.filter((n) => !n.visualizada).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[450px] max-w-[450px] bg-card border border-border rounded-md z-50 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-border gap-2 bg-muted/20">
                <span className="font-semibold text-sm sm:text-base text-foreground tracking-tight">
                  Notificações
                </span>
                <button
                  className="text-xs sm:text-sm text-[var(--ei-accent)] hover:text-[var(--ei-accent-hover)] transition-colors cursor-pointer whitespace-nowrap"
                  onClick={() => markAsRead(undefined)}
                  data-test="botao-marcar-todas-visualizadas"
                >
                  Marcar todas como visualizadas
                </button>
              </div>

              <div
                className="max-h-[60vh] sm:max-h-80 overflow-y-auto overflow-x-hidden"
                data-test="lista-notificacoes"
              >
                {notifications.length === 0 ? (
                  <div
                    className="p-6 text-center text-sm text-muted-foreground"
                    data-test="notificacoes-vazio"
                  >
                    Sem notificações
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      data-test="item-notificacao"
                      className={`px-4 py-3 cursor-pointer border-b last:border-b-0 border-border/70 hover:bg-muted/45 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 ${
                        n.visualizada ? 'bg-card' : 'bg-muted/40'
                      }`}
                      onClick={() => !n.visualizada && markAsRead(n._id)}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {!n.visualizada && (
                          <div
                            className="w-1.5 h-1.5 bg-[var(--ei-accent)] rounded-full shrink-0 mt-1.5"
                            data-test="indicador-nao-lida"
                          ></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm text-foreground wrap-break-word leading-snug ${!n.visualizada ? 'font-semibold' : 'font-medium'}`}
                            data-test="mensagem-notificacao"
                          >
                            {n.mensagem}
                          </p>
                        </div>
                      </div>
                      <div
                        className="text-xs text-muted-foreground sm:ml-2 shrink-0 pl-3.5 sm:pl-0"
                        data-test="data-notificacao"
                      >
                        {formatTempoRelativo(n.data_hora)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
