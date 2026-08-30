'use client';

import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OpcaoOrdenacao } from '@/lib/ordenacao';

const VALOR_PADRAO = 'padrao';

interface OrdenarPorSelectProps {
  value: string;
  onChange: (value: string) => void;
  opcoes: OpcaoOrdenacao[];
  'data-test'?: string;
}

export default function OrdenarPorSelect({
  value,
  onChange,
  opcoes,
  'data-test': dataTest = 'ordenar-select',
}: OrdenarPorSelectProps) {
  return (
    <Select
      value={value || VALOR_PADRAO}
      onValueChange={(novoValor) =>
        onChange(novoValor === VALOR_PADRAO ? '' : novoValor)
      }
    >
      <SelectTrigger
        className="h-11 max-w-[220px] shrink-0 bg-background/30 dark:bg-input/30"
        data-test={dataTest}
        aria-label="Ordenar por"
      >
        <ArrowUpDown className="w-4 h-4" />
        <SelectValue placeholder="Ordenar por" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value={VALOR_PADRAO}>Ordenação padrão</SelectItem>
        {opcoes.map((opcao) => (
          <SelectItem key={opcao.value} value={opcao.value}>
            {opcao.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
