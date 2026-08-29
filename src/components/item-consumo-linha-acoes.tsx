'use client';

import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface ItemConsumoLinhaAcoesProps {
  onEditar: () => void;
  onEmprestar: () => void;
  onExcluir: () => void;
  emprestarDesabilitado?: boolean;
  emprestarTitle?: string;
  'data-test'?: string;
}

export default function ItemConsumoLinhaAcoes({
  onEditar,
  onEmprestar,
  onExcluir,
  emprestarDesabilitado = false,
  emprestarTitle,
  'data-test': dataTest = 'item-consumo-acoes-trigger',
}: ItemConsumoLinhaAcoesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 flex items-center justify-center shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
          title="Ações do item"
          aria-label="Ações do item"
          data-test={dataTest}
        >
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEditar} data-test="edit-button">
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onEmprestar}
          disabled={emprestarDesabilitado}
          title={emprestarDesabilitado ? emprestarTitle : undefined}
          data-test="emprestimo-button"
        >
          Emprestar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onExcluir}
          variant="destructive"
          data-test="delete-button"
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
