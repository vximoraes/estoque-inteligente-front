'use client';

import { useEffect, useRef, useState } from 'react';
import { assinarFuso, definirFuso, fusoDoNavegador } from '@/lib/datas';
import { FusoHorarioContext, useFusoHorario } from '@/hooks/use-fuso-horario';
import { useSession } from '@/hooks/use-session';

export default function SincronizarFusoHorario({
  fuso: fusoDoServidor,
  children,
}: {
  fuso: string;
  children: React.ReactNode;
}) {
  const [fuso, setFuso] = useState(fusoDoServidor);
  const { user } = useSession();
  const { salvar } = useFusoHorario();
  const inicializado = useRef(false);

  useEffect(() => assinarFuso(setFuso), []);

  useEffect(() => {
    if (user?.fuso_horario) definirFuso(user.fuso_horario);
  }, [user?.fuso_horario]);

  useEffect(() => {
    if (!user?.id || user.fuso_horario || inicializado.current) return;
    inicializado.current = true;
    void salvar(fusoDoNavegador(), { recarregarDados: false });
  }, [user?.id, user?.fuso_horario, salvar]);

  return (
    <FusoHorarioContext.Provider value={fuso}>
      {children}
    </FusoHorarioContext.Provider>
  );
}
