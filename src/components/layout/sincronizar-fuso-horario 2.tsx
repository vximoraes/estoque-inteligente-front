'use client';

import { Fragment, useEffect, useRef } from 'react';
import { definirFuso, fusoDoNavegador } from '@/lib/datas';
import { useFusoAtual, useFusoHorario } from '@/hooks/use-fuso-horario';
import { useSession } from '@/hooks/use-session';

export default function SincronizarFusoHorario({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useSession();
  const { salvar } = useFusoHorario();
  const fuso = useFusoAtual();
  const inicializado = useRef(false);

  useEffect(() => {
    definirFuso(user?.fuso_horario || fusoDoNavegador());
  }, [user?.fuso_horario]);

  useEffect(() => {
    if (!user?.id || user.fuso_horario) return;
    if (inicializado.current) return;
    inicializado.current = true;
    void salvar(fusoDoNavegador());
  }, [user?.id, user?.fuso_horario, salvar]);

  return <Fragment key={fuso}>{children}</Fragment>;
}
