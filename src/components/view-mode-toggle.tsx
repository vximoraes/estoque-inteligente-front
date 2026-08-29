'use client';

import { LayoutGrid, List } from 'lucide-react';
import type { ViewMode } from '@/hooks/use-view-mode';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  'data-test'?: string;
}

export default function ViewModeToggle({
  value,
  onChange,
  'data-test': dataTest = 'view-mode-toggle',
}: ViewModeToggleProps) {
  return (
    <div
      className="h-11 flex items-center gap-0.5 px-1 rounded-md border border-border bg-background/30 shrink-0"
      data-test={dataTest}
    >
      <button
        type="button"
        onClick={() => onChange('cards')}
        className={`h-9 w-9 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
          value === 'cards'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Visualizar em cards"
        data-test={`${dataTest}-cards`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`h-9 w-9 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
          value === 'table'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Visualizar em tabela"
        data-test={`${dataTest}-table`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
