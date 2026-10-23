'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/fetchData';
import { definirFuso, usarFusoNaRenderizacao } from '@/lib/datas';
import { useSession } from '@/hooks/use-session';

export const FusoHorarioContext = createContext('UTC');

export function useFusoAtual() {
  const fuso = useContext(FusoHorarioContext);
  usarFusoNaRenderizacao(fuso);
  return fuso;
}

export function useFusoHorario() {
  const { user, refetch } = useSession();
  const queryClient = useQueryClient();
  const fuso = useFusoAtual();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useCallback(
    async (novoFuso: string, { recarregarDados = true } = {}) => {
      if (!user?.id) return;
      setSalvando(true);
      setErro(null);
      try {
        await patch(`/usuarios/${user.id}`, { fuso_horario: novoFuso });
        definirFuso(novoFuso);
        await refetch();
        if (recarregarDados) await queryClient.invalidateQueries();
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
