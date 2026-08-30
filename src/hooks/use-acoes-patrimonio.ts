'use client';

import { useState } from 'react';
import type { AcaoPatrimonio, PatrimonioData } from '@/types/patrimonios';

export interface AcaoPatrimonioContexto {
  tipo: AcaoPatrimonio;
  unidade: PatrimonioData;
}

// Estado da ação de patrimônio em curso (tipo + unidade), como snapshot
// próprio — não depende de props que o chamador pode zerar enquanto a ação
// ainda está em andamento.
export function useAcoesPatrimonio() {
  const [contexto, setContexto] = useState<AcaoPatrimonioContexto | null>(null);

  const abrir = (tipo: AcaoPatrimonio, unidade: PatrimonioData) => {
    setContexto({ tipo, unidade });
  };

  const fechar = () => setContexto(null);

  return { contexto, abrir, fechar };
}
