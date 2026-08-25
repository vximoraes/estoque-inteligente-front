'use client';

import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { AcaoPatrimonio, PatrimonioData } from '@/types/patrimonios';

interface PatrimonioLinhaAcoesProps {
  unidade: PatrimonioData;
  onAcao: (tipo: AcaoPatrimonio, unidade: PatrimonioData) => void;
  'data-test'?: string;
}

// Dropdown de ações de uma unidade patrimonial, com as regras de
// habilitação por status — conhecimento de domínio que não pode ser
// duplicado sem divergir na primeira mudança de regra do backend.
// Compartilhado entre o drawer (`sheet-unidades-item.tsx`) e a página
// global de unidades.
export default function PatrimonioLinhaAcoes({
  unidade,
  onAcao,
  'data-test': dataTest = 'patrimonio-acoes-trigger',
}: PatrimonioLinhaAcoesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1.5 rounded-md hover:bg-muted/60 cursor-pointer"
          data-test={dataTest}
          aria-label="Ações da unidade"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onAcao('emprestar', unidade)}
          disabled={unidade.status !== 'Disponível'}
        >
          Emprestar
        </DropdownMenuItem>
        {unidade.status === 'Manutenção' ? (
          <DropdownMenuItem
            onClick={() => onAcao('retornarManutencao', unidade)}
          >
            Retornar da manutenção
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onAcao('manutencao', unidade)}
            disabled={unidade.status !== 'Disponível'}
          >
            Manutenção
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onAcao('transferir', unidade)}
          disabled={unidade.status === 'Emprestado'}
        >
          Transferir
        </DropdownMenuItem>
        {unidade.status === 'Baixado' ? (
          <DropdownMenuItem onClick={() => onAcao('reativar', unidade)}>
            Reativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onAcao('baixar', unidade)}
            disabled={unidade.status === 'Emprestado'}
            variant="destructive"
          >
            Baixar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onAcao('remover', unidade)}
          disabled={unidade.status === 'Emprestado'}
          variant="destructive"
        >
          Remover (erro de cadastro)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
