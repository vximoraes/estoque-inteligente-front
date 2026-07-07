import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData } from '@/lib/fetchData';
import type { Conversa, ConversaResumo, PaginatedConversas } from '@/types/chat';

export function useConversas() {
  return useQuery<PaginatedConversas>({
    queryKey: ['conversas'],
    queryFn: async () => {
      const res = await fetchData<{ data: PaginatedConversas }>('/ia/conversas?limite=50');
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
        null,
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

export async function sendMessage(
  conversaId: string,
  content: string,
  callbacks: SendMessageCallbacks,
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${apiUrl}/ia/conversas/${conversaId}/mensagens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // cookie de sessão Better Auth
    body: JSON.stringify({ content }),
  });

  if (!response.ok || !response.body) {
    callbacks.onError('Erro ao conectar com o assistente.');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
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
          callbacks.onDone();
        } else if (event.type === 'error') {
          callbacks.onError(event.message ?? 'Erro no assistente.');
        }
      } catch (err) {
        console.error('Erro ao processar evento SSE:', err);
      }
    }
  }
}
