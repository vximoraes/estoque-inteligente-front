import { EstoqueData } from '@/types/itens';
import { Emprestimo } from '@/types/emprestimos';
import { PatrimonioData } from '@/types/patrimonios';
import { Movimentacao } from '@/types/movimentacoes';
import { getEmprestimoNome } from '@/lib/emprestimo';
import {
  gerarTabelaPDF,
  formatarDataHora,
  type ColunaRelatorio,
} from './relatorioTabela';

const CORES = {
  verde: [0, 128, 0] as [number, number, number],
  amareloEscuro: [200, 150, 0] as [number, number, number],
  vermelho: [200, 0, 0] as [number, number, number],
  cinza: [100, 100, 100] as [number, number, number],
};

// ==================== ALMOXARIFADO ====================

interface PDFGeneratorOptions {
  estoques: EstoqueData[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

const colunasAlmoxarifado: ColunaRelatorio<EstoqueData>[] = [
  { header: 'CÓDIGO', width: 25, get: (e) => e.item._id.slice(-8) },
  { header: 'PRODUTO', width: 60, get: (e) => e.item.nome },
  { header: 'QTD', width: 20, get: (e) => e.quantidade.toString() },
  {
    header: 'STATUS',
    width: 30,
    get: (e) => e.item.status,
    cor: (e) =>
      e.item.status === 'Em Estoque'
        ? CORES.verde
        : e.item.status === 'Baixo Estoque'
          ? CORES.amareloEscuro
          : CORES.vermelho,
  },
  { header: 'LOCALIZAÇÃO', width: 35, get: (e) => e.localizacao.nome },
];

export const generateAlmoxarifadoPDF = async ({
  estoques,
  fileName = 'relatorio-almoxarifado',
  title = 'RELATÓRIO DE ALMOXARIFADO',
  includeStats = true,
  userName = 'Administrador',
}: PDFGeneratorOptions) => {
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

  return gerarTabelaPDF({
    titulo: title,
    fileName,
    userName,
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

interface EmprestimosPDFGeneratorOptions {
  emprestimos: Emprestimo[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

const colunasEmprestimos: ColunaRelatorio<Emprestimo>[] = [
  { header: 'PRODUTO', width: 45, get: (e) => getEmprestimoNome(e) },
  {
    header: 'SOLICITANTE',
    width: 40,
    get: (e) => e.solicitante_nome || '-',
  },
  {
    header: 'QTD',
    width: 18,
    get: (e) => String(e.quantidade_emprestada ?? '-'),
  },
  {
    header: 'STATUS',
    width: 25,
    get: (e) => e.status,
    cor: (e) =>
      e.status === 'Ativo'
        ? CORES.verde
        : e.status === 'Atrasado'
          ? CORES.vermelho
          : CORES.cinza,
  },
  {
    header: 'SAÍDA',
    width: 30,
    get: (e) =>
      e.data_saida ? new Date(e.data_saida).toLocaleDateString('pt-BR') : '-',
  },
  {
    header: 'PREVISÃO',
    width: 30,
    get: (e) =>
      e.data_prevista_devolucao
        ? new Date(e.data_prevista_devolucao).toLocaleDateString('pt-BR')
        : 'Sem previsão',
  },
];

export const generateEmprestimosPDF = async ({
  emprestimos,
  fileName = 'relatorio-emprestimos',
  title = 'RELATÓRIO DE EMPRÉSTIMOS',
  includeStats = true,
  userName = 'Administrador',
}: EmprestimosPDFGeneratorOptions) => {
  const total = emprestimos.length;
  const ativos = emprestimos.filter((e) => e.status === 'Ativo').length;
  const atrasados = emprestimos.filter((e) => e.status === 'Atrasado').length;
  const devolvidos = emprestimos.filter((e) => e.status === 'Devolvido').length;

  return gerarTabelaPDF({
    titulo: title,
    fileName,
    userName,
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

interface PatrimonioPDFGeneratorOptions {
  patrimonios: PatrimonioData[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

const colunasPatrimonio: ColunaRelatorio<PatrimonioData>[] = [
  { header: 'Nº PATRIMÔNIO', width: 35, get: (p) => p.numero_patrimonio },
  {
    header: 'MODELO',
    width: 45,
    get: (p) => p.modelo || p.categoria.nome,
  },
  { header: 'LOCALIZAÇÃO', width: 35, get: (p) => p.localizacao.nome },
  {
    header: 'STATUS',
    width: 25,
    get: (p) => p.status,
    cor: (p) =>
      p.status === 'Disponível'
        ? CORES.verde
        : p.status === 'Baixado'
          ? CORES.vermelho
          : CORES.amareloEscuro,
  },
  {
    header: 'AQUISIÇÃO',
    width: 25,
    get: (p) =>
      p.data_aquisicao
        ? new Date(p.data_aquisicao).toLocaleDateString('pt-BR')
        : '—',
  },
];

export const generatePatrimonioPDF = async ({
  patrimonios,
  fileName = 'relatorio-patrimonio',
  title = 'RELATÓRIO DE PATRIMÔNIO',
  includeStats = true,
  userName = 'Administrador',
}: PatrimonioPDFGeneratorOptions) => {
  const total = patrimonios.length;
  const disponiveis = patrimonios.filter(
    (p) => p.status === 'Disponível',
  ).length;
  const emprestadas = patrimonios.filter(
    (p) => p.status === 'Emprestado',
  ).length;
  const baixadas = patrimonios.filter((p) => p.status === 'Baixado').length;

  return gerarTabelaPDF({
    titulo: title,
    fileName,
    userName,
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

interface MovimentacoesPDFGeneratorOptions {
  movimentacoes: Movimentacao[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

const colunasMovimentacoes: ColunaRelatorio<Movimentacao>[] = [
  { header: 'DATA/HORA', width: 32, get: (m) => formatarDataHora(m.data_hora) },
  { header: 'ITEM', width: 45, get: (m) => m.item?.nome || '-' },
  { header: 'QTD', width: 15, get: (m) => m.quantidade.toString() },
  {
    header: 'TIPO',
    width: 20,
    get: (m) => (m.tipo === 'entrada' ? 'Entrada' : 'Saída'),
    cor: (m) => (m.tipo === 'entrada' ? CORES.verde : CORES.vermelho),
  },
  { header: 'LOCALIZAÇÃO', width: 30, get: (m) => m.localizacao?.nome || '-' },
  { header: 'RESPONSÁVEL', width: 30, get: (m) => m.usuario?.nome || '-' },
];

export const generateMovimentacoesPDF = async ({
  movimentacoes,
  fileName = 'relatorio-movimentacoes',
  title = 'RELATÓRIO DE MOVIMENTAÇÕES',
  includeStats = true,
  userName = 'Administrador',
}: MovimentacoesPDFGeneratorOptions) => {
  const total = movimentacoes.length;
  const entradas = movimentacoes.filter((m) => m.tipo === 'entrada').length;
  const saidas = movimentacoes.filter((m) => m.tipo === 'saida').length;

  return gerarTabelaPDF({
    titulo: title,
    fileName,
    userName,
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
