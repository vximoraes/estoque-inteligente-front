import { EstoqueData } from '@/types/componentes';
import { Orcamento } from '@/types/orcamentos';

interface CSVGeneratorOptions {
  estoques: EstoqueData[];
  fileName?: string;
  includeStats?: boolean;
}

export const generateComponentesCSV = ({
  estoques,
  fileName = 'relatorio-componentes',
  includeStats = true,
}: CSVGeneratorOptions) => {
  // Preparar dados
  const lines: string[] = [];

  // ==================== CABEÇALHO ====================
  lines.push('RELATÓRIO DE COMPONENTES');
  lines.push(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`);
  lines.push('');

  // ==================== ESTATÍSTICAS ====================
  if (includeStats && estoques.length > 0) {
    const totalComponentes = new Set(estoques.map(e => e.componente._id)).size;
    const emEstoque = estoques.filter(e => e.componente.status === 'Em Estoque').length;
    const baixoEstoque = estoques.filter(e => e.componente.status === 'Baixo Estoque').length;
    const indisponiveis = estoques.filter(e => e.componente.status === 'Indisponível').length;
    const quantidadeTotal = estoques.reduce((acc, e) => acc + e.quantidade, 0);

    lines.push('RESUMO ESTATÍSTICO');
    lines.push(`Total de Componentes Únicos,${totalComponentes}`);
    lines.push(`Total de Itens em Estoque,${quantidadeTotal}`);
    lines.push(`Em Estoque,${emEstoque}`);
    lines.push(`Baixo Estoque,${baixoEstoque}`);
    lines.push(`Indisponíveis,${indisponiveis}`);
    lines.push('');
  }

  // ==================== TABELA DE COMPONENTES ====================
  lines.push('COMPONENTES SELECIONADOS');
  
  // Cabeçalho da tabela
  const headers = [
    'CÓDIGO',
    'PRODUTO',
    'DESCRIÇÃO',
    'CATEGORIA',
    'QUANTIDADE',
    'ESTOQUE MÍNIMO',
    'STATUS',
    'LOCALIZAÇÃO',
    'DATA CRIAÇÃO',
    'ÚLTIMA ATUALIZAÇÃO'
  ];
  lines.push(headers.join(','));

  // Dados da tabela
  estoques.forEach((estoque) => {
    const row = [
      // Código completo
      `"${estoque.componente._id}"`,
      
      // Nome do produto (escapar vírgulas e aspas)
      `"${escapeCSV(estoque.componente.nome)}"`,
      
      // Descrição
      `"${escapeCSV(estoque.componente.descricao || '-')}"`,
      
      // Categoria (se for string, usar diretamente, se for objeto, pegar o ID)
      `"${typeof estoque.componente.categoria === 'string' 
        ? estoque.componente.categoria 
        : estoque.componente.categoria}"`,
      
      // Quantidade
      estoque.quantidade.toString(),
      
      // Estoque mínimo
      estoque.componente.estoque_minimo.toString(),
      
      // Status
      `"${estoque.componente.status}"`,
      
      // Localização
      `"${escapeCSV(estoque.localizacao.nome)}"`,
      
      // Data de criação
      `"${formatDate(estoque.createdAt)}"`,
      
      // Data de atualização
      `"${formatDate(estoque.updatedAt)}"`
    ];
    
    lines.push(row.join(','));
  });

  // Adicionar rodapé
  lines.push('');
  lines.push(`Total de registros exportados: ${estoques.length}`);
  lines.push('Estoque Inteligente - Sistema de Gerenciamento');

  // Converter para CSV e fazer download
  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
    const hoje = new Date();
    const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${sanitizedFileName}-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Função auxiliar para escapar caracteres especiais no CSV
const escapeCSV = (text: string): string => {
  if (!text) return '';
  
  // Substituir aspas duplas por aspas duplas escapadas
  let escaped = text.replace(/"/g, '""');
  
  // Remover quebras de linha
  escaped = escaped.replace(/\n/g, ' ').replace(/\r/g, '');
  
  return escaped;
};

// Função auxiliar para formatar datas
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// ==================== GERADOR DE CSV PARA ORÇAMENTOS ====================

interface OrcamentoCSVGeneratorOptions {
  orcamentos: Orcamento[];
  fileName?: string;
  includeStats?: boolean;
}

export const generateOrcamentosCSV = ({
  orcamentos,
  fileName = 'relatorio-orcamentos',
  includeStats = true,
}: OrcamentoCSVGeneratorOptions) => {
  // Preparar dados
  const lines: string[] = [];

  // ==================== CABEÇALHO ====================
  lines.push('RELATÓRIO DE ORÇAMENTOS');
  lines.push(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`);
  lines.push('');

  // ==================== ESTATÍSTICAS ====================
  if (includeStats && orcamentos.length > 0) {
    const totalOrcamentos = orcamentos.length;
    const valorTotal = orcamentos.reduce((acc, orc) => acc + orc.total, 0);
    const valorMedio = valorTotal / totalOrcamentos;
    const maiorOrcamento = Math.max(...orcamentos.map(orc => orc.total));
    const menorOrcamento = Math.min(...orcamentos.map(orc => orc.total));
    const totalComponentes = orcamentos.reduce((acc, orc) => acc + orc.componentes.length, 0);

    lines.push('RESUMO ESTATÍSTICO');
    lines.push(`Total de Orçamentos,${totalOrcamentos}`);
    lines.push(`Valor Total,R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    lines.push(`Valor Médio,R$ ${valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    lines.push(`Maior Orçamento,R$ ${maiorOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    lines.push(`Menor Orçamento,R$ ${menorOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    lines.push(`Total de Componentes,${totalComponentes}`);
    lines.push('');
  }

  // ==================== TABELA DE ORÇAMENTOS ====================
  lines.push('ORÇAMENTOS SELECIONADOS');
  
  // Cabeçalho da tabela
  const headers = [
    'CÓDIGO',
    'NOME',
    'DESCRIÇÃO',
    'QTD ITENS',
    'VALOR TOTAL',
    'DATA CRIAÇÃO',
    'ÚLTIMA ATUALIZAÇÃO'
  ];
  lines.push(headers.join(','));

  // Dados da tabela
  orcamentos.forEach((orcamento) => {
    const row = [
      // Código completo
      `"${orcamento._id}"`,
      
      // Nome do orçamento (escapar vírgulas e aspas)
      `"${escapeCSV(orcamento.nome)}"`,
      
      // Descrição
      `"${escapeCSV(orcamento.descricao || '-')}"`,
      
      // Quantidade de itens
      orcamento.componentes.length.toString(),
      
      // Valor total formatado
      `"R$ ${orcamento.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
      
      // Data de criação
      `"${orcamento.createdAt ? formatDate(orcamento.createdAt) : '-'}"`,
      
      // Data de atualização
      `"${orcamento.updatedAt ? formatDate(orcamento.updatedAt) : '-'}"`
    ];
    
    lines.push(row.join(','));
  });

  // Adicionar rodapé
  lines.push('');
  lines.push(`Total de registros exportados: ${orcamentos.length}`);
  lines.push('Estoque Inteligente - Sistema de Gerenciamento');

  // Converter para CSV e fazer download
  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
    const hoje = new Date();
    const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${sanitizedFileName}-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// ==================== GERADOR DE CSV PARA MOVIMENTAÇÕES ====================

interface MovimentacaoCSVGeneratorOptions {
  movimentacoes: any[];
  fileName?: string;
  includeStats?: boolean;
}

export const generateMovimentacoesCSV = ({
  movimentacoes,
  fileName = 'relatorio-movimentacoes',
  includeStats = true,
}: MovimentacaoCSVGeneratorOptions) => {
  const lines: string[] = [];

 // Cabeçalho
  lines.push('RELATÓRIO DE MOVIMENTAÇÕES');
  lines.push(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`);
  lines.push('');

  // Estatísticas simples
  if (includeStats && movimentacoes.length > 0) {
    const entradas = movimentacoes.filter(m => m.tipo === 'Entrada').length;
    const saidas = movimentacoes.filter(m => m.tipo === 'Saída' || m.tipo === 'Saida').length;
    const total = movimentacoes.length;

    lines.push('RESUMO ESTATÍSTICO');
    lines.push(`Total de Movimentações,${total}`);
    lines.push(`Entradas,${entradas}`);
    lines.push(`Saídas,${saidas}`);
    lines.push('');
  }

    // Tabela
  lines.push('MOVIMENTAÇÕES SELECIONADAS');
  const headers = ['CÓDIGO', 'TIPO', 'PRODUTO', 'QUANTIDADE', 'LOCALIZAÇÃO', 'DATA'];
  lines.push(headers.join(','));

  movimentacoes.forEach((mov) => {
    const codigo = mov.componente?._id || mov._id || '-';
    const produto = mov.componente?.nome ? escapeCSV(mov.componente.nome) : '-';
    const quantidade = (mov.quantidade ?? 0).toString();
    const tipo = mov.tipo || '-';
    const local = mov.localizacao?.nome ? escapeCSV(mov.localizacao.nome) : '-';
    const data = mov.createdAt ? formatDate(mov.createdAt) : '-';

    const row = [
      `"${codigo}"`,
      `"${tipo}"`,
      `"${produto}"`,
      quantidade,
      `"${local}"`,
      `"${data}"`
    ];

    lines.push(row.join(','));
  });

  // Rodapé
  lines.push('');
  lines.push(`Total de registros exportados: ${movimentacoes.length}`);
  lines.push('Estoque Inteligente - Sistema de Gerenciamento');

  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
    const hoje = new Date();
    const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `${sanitizedFileName}-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
