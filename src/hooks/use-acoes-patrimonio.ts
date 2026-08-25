'use client';

import { useState } from 'react';
import type { AcaoPatrimonio, PatrimonioData } from '@/types/patrimonios';

export interface AcaoPatrimonioContexto {
  tipo: AcaoPatrimonio;
  unidade: PatrimonioData;
  itemId: string;
  itemNome: string;
}

// Estado da ação de patrimônio em curso (tipo + unidade + item), como
// snapshot próprio — não depende de props que o chamador pode zerar
// enquanto a ação ainda está em andamento (ver `sheet-unidades-item.tsx`
// para o caso concreto: o drawer fecha antes de abrir o histórico).
export function useAcoesPatrimonio(aoAbrirHistorico?: () => void) {
  const [contexto, setContexto] = useState<AcaoPatrimonioContexto | null>(null);

  const abrir = (
    tipo: AcaoPatrimonio,
    unidade: PatrimonioData,
    itemId: string,
    itemNome: string,
  ) => {
    setContexto({ tipo, unidade, itemId, itemNome });
    if (tipo === 'historico') aoAbrirHistorico?.();
  };

  const fechar = () => setContexto(null);

  return { contexto, abrir, fechar };
}
