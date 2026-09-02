import { EstoqueData } from '@/types/itens';
import { Emprestimo } from '@/types/emprestimos';
import { getEmprestimoNome } from '@/lib/emprestimo';

interface CSVGeneratorOptions {
  estoques: EstoqueData[];
  fileName?: string;
  includeStats?: boolean;
}

export const generateAlmoxarifadoCSV = ({
  estoques,
  fileName = 'relatorio-almoxarifado',
  includeStats = true,
}: CSVGeneratorOptions) => {
  // Preparar dados
  const lines: string[] = [];

  // ==================== CABEÇALHO ====================
  lines.push('RELATÓRIO DE ALMOXARIFADO');
  lines.push(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
  );
  lines.push('');

  // ==================== ESTATÍSTICAS ====================
  if (includeStats && estoques.length > 0) {
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

    lines.push('RESUMO ESTATÍSTICO');
    lines.push(`Total de Itens Únicos,${totalItens}`);
    lines.push(`Total de Itens em Estoque,${quantidadeTotal}`);
    lines.push(`Em Estoque,${emEstoque}`);
    lines.push(`Baixo Estoque,${baixoEstoque}`);
    lines.push(`Indisponíveis,${indisponiveis}`);
    lines.push('');
  }

  // ==================== TABELA DE ITENS ====================
  lines.push('ITENS SELECIONADOS');

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
    'ÚLTIMA ATUALIZAÇÃO',
  ];
  lines.push(headers.join(','));

  // Dados da tabela
  estoques.forEach((estoque) => {
    const row = [
      // Código completo
      `"${estoque.item._id}"`,

      // Nome do produto (escapar vírgulas e aspas)
      `"${escapeCSV(estoque.item.nome)}"`,

      // Descrição
      `"${escapeCSV(estoque.item.descricao || '-')}"`,

      // Categoria (se for string, usar diretamente, se for objeto, pegar o ID)
      `"${
        typeof estoque.item.categoria === 'string'
          ? estoque.item.categoria
          : estoque.item.categoria
      }"`,

      // Quantidade
      estoque.quantidade.toString(),

      // Estoque mínimo
      estoque.item.estoque_minimo.toString(),

      // Status
      `"${estoque.item.status}"`,

      // Localização
      `"${escapeCSV(estoque.localizacao.nome)}"`,

      // Data de criação
      `"${formatDate(estoque.createdAt)}"`,

      // Data de atualização
      `"${formatDate(estoque.updatedAt)}"`,
    ];

    lines.push(row.join(','));
  });

  // Adicionar rodapé
  lines.push('');
  lines.push(`Total de registros exportados: ${estoques.length}`);
  lines.push('Estoque Inteligente - Sistema de Gerenciamento');

  // Converter para CSV e fazer download
  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
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

  // Prevenir injeção de fórmula
  if (/^[=+\-@\t]/.test(escaped)) {
    escaped = `'${escaped}`;
  }

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
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

// ==================== GERADOR DE CSV PARA EMPRÉSTIMOS ====================

interface EmprestimoCSVGeneratorOptions {
  emprestimos: Emprestimo[];
  fileName?: string;
  includeStats?: boolean;
}

export const generateEmprestimosCSV = ({
  emprestimos,
  fileName = 'relatorio-emprestimos',
  includeStats = true,
}: EmprestimoCSVGeneratorOptions) => {
  const lines: string[] = [];

  lines.push('RELATÓRIO DE EMPRÉSTIMOS');
  lines.push(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
  );
  lines.push('');

  if (includeStats && emprestimos.length > 0) {
    const total = emprestimos.length;
    const ativos = emprestimos.filter((e) => e.status === 'Ativo').length;
    const atrasados = emprestimos.filter((e) => e.status === 'Atrasado').length;
    const devolvidos = emprestimos.filter(
      (e) => e.status === 'Devolvido',
    ).length;

    lines.push('RESUMO ESTATÍSTICO');
    lines.push(`Total de Empréstimos,${total}`);
    lines.push(`Ativos,${ativos}`);
    lines.push(`Atrasados,${atrasados}`);
    lines.push(`Devolvidos,${devolvidos}`);
    lines.push('');
  }

  lines.push('EMPRÉSTIMOS SELECIONADOS');
  const headers = [
    'CÓDIGO',
    'PRODUTO',
    'SOLICITANTE',
    'QUANTIDADE EMPRESTADA',
    'QUANTIDADE ABERTA',
    'STATUS',
    'LOCALIZAÇÃO',
    'DATA SAÍDA',
    'DATA PREVISTA DEVOLUÇÃO',
  ];
  lines.push(headers.join(','));

  emprestimos.forEach((emp) => {
    const codigo = emp._id || '-';
    const produto = escapeCSV(getEmprestimoNome(emp));
    const solicitante = escapeCSV(emp.solicitante_nome || '-');
    const quantidade = (emp.quantidade_emprestada ?? 0).toString();
    const quantidadeAberta = (emp.quantidade_aberta ?? 0).toString();
    const status = emp.status || '-';
    const local = emp.localizacao?.nome ? escapeCSV(emp.localizacao.nome) : '-';
    const dataSaida = emp.data_saida ? formatDate(emp.data_saida) : '-';
    const dataPrevista = emp.data_prevista_devolucao
      ? formatDate(emp.data_prevista_devolucao)
      : 'Sem previsão';

    const row = [
      `"${codigo}"`,
      `"${produto}"`,
      `"${solicitante}"`,
      quantidade,
      quantidadeAberta,
      `"${status}"`,
      `"${local}"`,
      `"${dataSaida}"`,
      `"${dataPrevista}"`,
    ];

    lines.push(row.join(','));
  });

  lines.push('');
  lines.push(`Total de registros exportados: ${emprestimos.length}`);
  lines.push('Estoque Inteligente - Sistema de Gerenciamento');

  const csvContent = lines.join('\n');
  const blob = new Blob(['﻿' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
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
