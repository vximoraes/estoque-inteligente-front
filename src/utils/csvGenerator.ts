import { EstoqueData } from '@/types/itens';
import { Emprestimo } from '@/types/emprestimos';
import { PatrimonioData } from '@/types/patrimonios';
import { Movimentacao } from '@/types/movimentacoes';
import { getEmprestimoNome } from '@/lib/emprestimo';
import {
  gerarTabelaCSV,
  formatarDataHora,
  type ColunaRelatorio,
} from './relatorioTabela';

// ==================== ALMOXARIFADO ====================

interface CSVGeneratorOptions {
  estoques: EstoqueData[];
  fileName?: string;
  includeStats?: boolean;
}

const colunasAlmoxarifado: ColunaRelatorio<EstoqueData>[] = [
  { header: 'CÓDIGO', get: (e) => e.item._id },
  { header: 'PRODUTO', get: (e) => e.item.nome },
  { header: 'DESCRIÇÃO', get: (e) => e.item.descricao || '-' },
  { header: 'CATEGORIA', get: (e) => String(e.item.categoria) },
  { header: 'QUANTIDADE', get: (e) => e.quantidade.toString() },
  { header: 'ESTOQUE MÍNIMO', get: (e) => e.item.estoque_minimo.toString() },
  { header: 'STATUS', get: (e) => e.item.status },
  { header: 'LOCALIZAÇÃO', get: (e) => e.localizacao.nome },
  { header: 'DATA CRIAÇÃO', get: (e) => formatarDataHora(e.createdAt) },
  { header: 'ÚLTIMA ATUALIZAÇÃO', get: (e) => formatarDataHora(e.updatedAt) },
];

export const generateAlmoxarifadoCSV = ({
  estoques,
  fileName = 'relatorio-almoxarifado',
  includeStats = true,
}: CSVGeneratorOptions) => {
  const totalItens = new Set(estoques.map((e) => e.item._id)).size;
  const emEstoque = estoques.filter(
    (e) => e.item.status === 'Em Estoque',
  ).length;
  const baixoEstoque = estoques.filter(
    (e) => e.item.status === 'Baixo Estoque',
  ).length;
  const indisponiveis = estoques.filter(
    (e) => e.item.status === 'Indisponível',
  ).length;
  const quantidadeTotal = estoques.reduce((acc, e) => acc + e.quantidade, 0);

  gerarTabelaCSV({
    titulo: 'RELATÓRIO DE ALMOXARIFADO',
    fileName,
    colunas: colunasAlmoxarifado,
    linhas: estoques,
    nomeSecaoTabela: 'ITENS SELECIONADOS',
    stats: includeStats
      ? [
          { label: 'Total de Itens Únicos', value: totalItens },
          { label: 'Total de Itens em Estoque', value: quantidadeTotal },
          { label: 'Em Estoque', value: emEstoque },
          { label: 'Baixo Estoque', value: baixoEstoque },
          { label: 'Indisponíveis', value: indisponiveis },
        ]
      : undefined,
  });
};

// ==================== EMPRÉSTIMOS ====================

interface EmprestimoCSVGeneratorOptions {
  emprestimos: Emprestimo[];
  fileName?: string;
  includeStats?: boolean;
}

const colunasEmprestimos: ColunaRelatorio<Emprestimo>[] = [
  { header: 'CÓDIGO', get: (e) => e._id || '-' },
  { header: 'PRODUTO', get: (e) => getEmprestimoNome(e) },
  { header: 'SOLICITANTE', get: (e) => e.solicitante_nome || '-' },
  {
    header: 'QUANTIDADE EMPRESTADA',
    get: (e) => (e.quantidade_emprestada ?? 0).toString(),
  },
  {
    header: 'QUANTIDADE ABERTA',
    get: (e) => (e.quantidade_aberta ?? 0).toString(),
  },
  { header: 'STATUS', get: (e) => e.status || '-' },
  { header: 'LOCALIZAÇÃO', get: (e) => e.localizacao?.nome || '-' },
  {
    header: 'DATA SAÍDA',
    get: (e) => (e.data_saida ? formatarDataHora(e.data_saida) : '-'),
  },
  {
    header: 'DATA PREVISTA DEVOLUÇÃO',
    get: (e) =>
      e.data_prevista_devolucao
        ? formatarDataHora(e.data_prevista_devolucao)
        : 'Sem previsão',
  },
];

export const generateEmprestimosCSV = ({
  emprestimos,
  fileName = 'relatorio-emprestimos',
  includeStats = true,
}: EmprestimoCSVGeneratorOptions) => {
  const total = emprestimos.length;
  const ativos = emprestimos.filter((e) => e.status === 'Ativo').length;
  const atrasados = emprestimos.filter((e) => e.status === 'Atrasado').length;
  const devolvidos = emprestimos.filter((e) => e.status === 'Devolvido').length;

  gerarTabelaCSV({
    titulo: 'RELATÓRIO DE EMPRÉSTIMOS',
    fileName,
    colunas: colunasEmprestimos,
    linhas: emprestimos,
    nomeSecaoTabela: 'EMPRÉSTIMOS SELECIONADOS',
    stats: includeStats
      ? [
          { label: 'Total de Empréstimos', value: total },
          { label: 'Ativos', value: ativos },
          { label: 'Atrasados', value: atrasados },
          { label: 'Devolvidos', value: devolvidos },
        ]
      : undefined,
  });
};

// ==================== PATRIMÔNIO ====================

interface PatrimonioCSVGeneratorOptions {
  patrimonios: PatrimonioData[];
  fileName?: string;
  includeStats?: boolean;
}

const colunasPatrimonio: ColunaRelatorio<PatrimonioData>[] = [
  { header: 'Nº PATRIMÔNIO', get: (p) => p.numero_patrimonio },
  { header: 'MODELO', get: (p) => p.modelo || p.categoria.nome },
  { header: 'CATEGORIA', get: (p) => p.categoria.nome },
  { header: 'LOCALIZAÇÃO', get: (p) => p.localizacao.nome },
  { header: 'STATUS', get: (p) => p.status },
  {
    header: 'DATA AQUISIÇÃO',
    get: (p) => (p.data_aquisicao ? formatarDataHora(p.data_aquisicao) : '-'),
  },
];

export const generatePatrimonioCSV = ({
  patrimonios,
  fileName = 'relatorio-patrimonio',
  includeStats = true,
}: PatrimonioCSVGeneratorOptions) => {
  const total = patrimonios.length;
  const disponiveis = patrimonios.filter(
    (p) => p.status === 'Disponível',
  ).length;
  const emprestadas = patrimonios.filter(
    (p) => p.status === 'Emprestado',
  ).length;
  const baixadas = patrimonios.filter((p) => p.status === 'Baixado').length;

  gerarTabelaCSV({
    titulo: 'RELATÓRIO DE PATRIMÔNIO',
    fileName,
    colunas: colunasPatrimonio,
    linhas: patrimonios,
    nomeSecaoTabela: 'UNIDADES SELECIONADAS',
    stats: includeStats
      ? [
          { label: 'Total de Unidades', value: total },
          { label: 'Disponíveis', value: disponiveis },
          { label: 'Emprestadas', value: emprestadas },
          { label: 'Baixadas', value: baixadas },
        ]
      : undefined,
  });
};

// ==================== MOVIMENTAÇÕES ====================

interface MovimentacaoCSVGeneratorOptions {
  movimentacoes: Movimentacao[];
  fileName?: string;
  includeStats?: boolean;
}

const colunasMovimentacoes: ColunaRelatorio<Movimentacao>[] = [
  { header: 'DATA/HORA', get: (m) => formatarDataHora(m.data_hora) },
  { header: 'TIPO', get: (m) => (m.tipo === 'entrada' ? 'Entrada' : 'Saída') },
  { header: 'ITEM', get: (m) => m.item?.nome || '-' },
  { header: 'QUANTIDADE', get: (m) => m.quantidade.toString() },
  { header: 'LOCALIZAÇÃO', get: (m) => m.localizacao?.nome || '-' },
  { header: 'RESPONSÁVEL', get: (m) => m.usuario?.nome || '-' },
];

export const generateMovimentacoesCSV = ({
  movimentacoes,
  fileName = 'relatorio-movimentacoes',
  includeStats = true,
}: MovimentacaoCSVGeneratorOptions) => {
  const total = movimentacoes.length;
  const entradas = movimentacoes.filter((m) => m.tipo === 'entrada').length;
  const saidas = movimentacoes.filter((m) => m.tipo === 'saida').length;

  gerarTabelaCSV({
    titulo: 'RELATÓRIO DE MOVIMENTAÇÕES',
    fileName,
    colunas: colunasMovimentacoes,
    linhas: movimentacoes,
    nomeSecaoTabela: 'MOVIMENTAÇÕES SELECIONADAS',
    stats: includeStats
      ? [
          { label: 'Total de Movimentações', value: total },
          { label: 'Entradas', value: entradas },
          { label: 'Saídas', value: saidas },
        ]
      : undefined,
  });
};
