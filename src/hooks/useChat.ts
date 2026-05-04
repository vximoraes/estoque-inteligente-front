import { getSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData } from '@/lib/fetchData';
import type { Conversa, ConversaResumo, PaginatedConversas } from '@/types/chat';

async function getToken(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.accessToken ?? null;
}

export function useConversas() {
  return useQuery<PaginatedConversas>({
    queryKey: ['conversas'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetchData<{ data: PaginatedConversas }>(
        '/ia/conversas?limite=50',
        'GET',
        token,
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
      const token = await getToken();
      const res = await fetchData<{ data: Conversa }>(`/ia/conversas/${id}`, 'GET', token);
      return res.data;
    },
  });
}

export function useCreateConversa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mensagemInicial?: string) => {
      const token = await getToken();
      const res = await fetchData<{ data: ConversaResumo }>(
        '/ia/conversas',
        'POST',
        token,
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
      const token = await getToken();
      await fetchData(`/ia/conversas/${id}`, 'DELETE', token);
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
  const session = await getSession();
  const token = session?.user?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${apiUrl}/ia/conversas/${conversaId}/mensagens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
