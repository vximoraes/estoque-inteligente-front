'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { useSession } from '@/hooks/use-session';

interface NaoLidasApiResponse {
  data: { totalDocs: number };
}

export function useNotificacoesNaoLidas(refetchInterval: number | false) {
  const { user } = useSession();

  const { data } = useQuery<NaoLidasApiResponse>({
    queryKey: ['notificacoes', 'nao-lidas', user?.id],
    queryFn: () =>
      get<NaoLidasApiResponse>(
        '/notificacoes?visualizada=false&limite=1&page=1',
      ),
    enabled: !!user?.id,
    refetchInterval,
  });

  return data?.data?.totalDocs ?? 0;
}
