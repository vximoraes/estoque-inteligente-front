'use client';

import { useEffect, useState } from 'react';

export type ViewMode = 'cards' | 'table';

export function useViewMode(
  chave: string,
): [ViewMode, (modo: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>('cards');

  useEffect(() => {
    const armazenado = localStorage.getItem(`view-mode:${chave}`);
    if (armazenado === 'cards' || armazenado === 'table') {
      setViewModeState(armazenado);
    }
  }, [chave]);

  const setViewMode = (modo: ViewMode) => {
    setViewModeState(modo);
    localStorage.setItem(`view-mode:${chave}`, modo);
  };

  return [viewMode, setViewMode];
}
