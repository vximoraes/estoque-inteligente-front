import type { QueryClient } from '@tanstack/react-query';

const CHAVES_AFETADAS_POR_MOVIMENTO = [
  'itens',
  'item',
  'estoques',
  'estoques-relatorio',
  'itens-relatorio-global-stats',
  'itens-dropdown-emprestimo',
  'movimentacoes-relatorio',
  'movimentacoes-relatorio-resumo',
  'movimentacoes-tendencia',
  'emprestimos',
  'emprestimos-relatorio',
  'emprestimos-relatorio-global-stats',
  'emprestimos-tendencia',
  'patrimonios',
  'patrimonios-relatorio',
  'patrimonios-relatorio-stats',
  'patrimonios-disponiveis-emprestimo',
  'patrimonio-eventos',
];

export function invalidarDadosDeEstoque(queryClient: QueryClient) {
  CHAVES_AFETADAS_POR_MOVIMENTO.forEach((chave) =>
    queryClient.invalidateQueries({ queryKey: [chave] }),
  );
}
