'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { assinarFuso, definirFuso, obterFuso } from '@/lib/datas';
import { useSession } from '@/hooks/use-session';

export function useFusoAtual() {
  return useSyncExternalStore(assinarFuso, obterFuso, () => 'UTC');
}

export function useFusoHorario() {
  const { user, refetch } = useSession();
  const queryClient = useQueryClient();
  const fuso = useFusoAtual();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useCallback(
    async (novoFuso: string) => {
      if (!user?.id) return;
      setSalvando(true);
      setErro(null);
      try {
        await patch(`/usuarios/${user.id}`, { fuso_horario: novoFuso });
        definirFuso(novoFuso);
        await refetch();
        await queryClient.invalidateQueries();
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao salvar fuso horário');
      } finally {
        setSalvando(false);
      }
    },
    [user?.id, refetch, queryClient],
  );

  return {
    fuso,
    fusoSalvo: user?.fuso_horario || null,
    salvar,
    salvando,
    erro,
  };
}
