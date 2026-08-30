import { Emprestimo } from '@/types/emprestimos';

export function getEmprestimoNome(emprestimo: Emprestimo): string {
  if (emprestimo.tipo_controle === 'unidade') {
    return emprestimo.patrimonio?.numero_patrimonio || 'Patrimônio';
  }
  return emprestimo.item?.nome || 'Item';
}
