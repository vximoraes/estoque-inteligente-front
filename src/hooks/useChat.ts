import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData } from '@/lib/fetchData';
import { authClient } from '@/lib/auth-client';
import type {
  Conversa,
  ConversaResumo,
  PaginatedConversas,
} from '@/types/chat';

export function useConversas() {
  return useQuery<PaginatedConversas>({
    queryKey: ['conversas'],
    queryFn: async () => {
      const res = await fetchData<{ data: PaginatedConversas }>(
        '/ia/conversas?limite=50',
      );
      return res.data;
    },
  });
}

export function useConversa(id: string | null) {
  return useQuery<Conversa>({
    queryKey: ['conversa', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetchData<{ data: Conversa }>(`/ia/conversas/${id}`);
      return res.data;
    },
  });
}

export function useCreateConversa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mensagemInicial?: string) => {
      const res = await fetchData<{ data: ConversaResumo }>(
        '/ia/conversas',
        'POST',
        mensagemInicial ? { mensagem_inicial: mensagemInicial } : undefined,
      );
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversas'] }),
  });
}

export function useDeleteConversa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchData(`/ia/conversas/${id}`, 'DELETE');
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversas'] }),
  });
}

export interface SendMessageCallbacks {
  onToken: (chunk: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export async function sendMessage(
  conversaId: string,
  content: string,
  callbacks: SendMessageCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/ia/conversas/${conversaId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // cookie de sessão Better Auth
      body: JSON.stringify({ content }),
      signal,
    });
  } catch (err) {
    if (isAbortError(err)) return;
    callbacks.onError('Erro ao conectar com o assistente.');
    return;
  }

  if (!response.ok) {
    if (
      (response.status === 401 || response.status === 498) &&
      typeof window !== 'undefined'
    ) {
      await authClient.signOut().catch(() => {});
      window.location.href = '/login';
      return;
    }

    const mensagem = await response
      .json()
      .then((data) => data?.message as string | undefined)
      .catch(() => undefined);
    callbacks.onError(mensagem ?? 'Erro ao conectar com o assistente.');
    return;
  }

  if (!response.body) {
    callbacks.onError('Erro ao conectar com o assistente.');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalizado = false;

  while (true) {
    let done: boolean;
    let value: Uint8Array | undefined;
    try {
      ({ done, value } = await reader.read());
    } catch (err) {
      if (isAbortError(err)) return;
      throw err;
    }
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;
      try {
        const event = JSON.parse(jsonStr);
        if (event.type === 'token') {
          callbacks.onToken(event.content);
        } else if (event.type === 'done') {
          finalizado = true;
          callbacks.onDone();
        } else if (event.type === 'error') {
          finalizado = true;
          callbacks.onError(event.message ?? 'Erro no assistente.');
        }
      } catch (err) {
        console.error('Erro ao processar evento SSE:', err);
      }
    }
  }

  if (!finalizado) {
    callbacks.onDone();
  }
}
