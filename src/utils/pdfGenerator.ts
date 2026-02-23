import jsPDF from 'jspdf';
import { EstoqueData } from '@/types/itens';
import { Orcamento } from '@/types/orcamentos';

interface PDFGeneratorOptions {
  estoques: EstoqueData[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

export const generateItensPDF = async ({
  estoques,
  fileName = 'relatorio-itens',
  title = 'RELATÓRIO DE ITENS',
  includeStats = true,
  userName = 'Javascript',
}: PDFGeneratorOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ==================== CABEÇALHO ====================
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Data e hora de geração
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' },
  );
  doc.text(`Gerado por: ${userName}`, pageWidth / 2, yPosition + 6, {
    align: 'center',
  });
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // ==================== ESTATÍSTICAS ====================
  if (includeStats) {
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

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO ESTATÍSTICO', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const stats = [
      `Total de Itens Únicos: ${totalItens}`,
      `Total de Itens em Estoque: ${quantidadeTotal}`,
      `Em Estoque: ${emEstoque}`,
      `Baixo Estoque: ${baixoEstoque}`,
      `Indisponíveis: ${indisponiveis}`,
    ];

    stats.forEach((stat) => {
      doc.text(stat, margin + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  }

  // ==================== TABELA DE COMPONENTES ====================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ITENS SELECIONADOS', margin, yPosition);
  yPosition += 8;

  // Cabeçalho da tabela
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');

  const colWidths = {
    codigo: 25,
    produto: 60,
    quantidade: 20,
    status: 30,
    localizacao: 35,
  };

  let xPos = margin + 2;
  doc.text('CÓDIGO', xPos, yPosition);
  xPos += colWidths.codigo;
  doc.text('PRODUTO', xPos, yPosition);
  xPos += colWidths.produto;
  doc.text('QTD', xPos, yPosition);
  xPos += colWidths.quantidade;
  doc.text('STATUS', xPos, yPosition);
  xPos += colWidths.status;
  doc.text('LOCALIZAÇÃO', xPos, yPosition);
  yPosition += 7;

  // Linha abaixo do cabeçalho
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Dados da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  estoques.forEach((estoque, index) => {
    checkPageBreak(15);

    // Fundo alternado para linhas
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
    }

    xPos = margin + 2;

    // Código (últimos 8 caracteres)
    const codigo = estoque.item._id.slice(-8);
    doc.text(codigo, xPos, yPosition);
    xPos += colWidths.codigo;

    // Produto (nome do item - truncado se necessário)
    const nomeProduto =
      estoque.item.nome.length > 40
        ? estoque.item.nome.substring(0, 37) + '...'
        : estoque.item.nome;
    doc.text(nomeProduto, xPos, yPosition);
    xPos += colWidths.produto;

    // Quantidade
    doc.text(estoque.quantidade.toString(), xPos, yPosition);
    xPos += colWidths.quantidade;

    // Status com cor
    const status = estoque.item.status;
    if (status === 'Em Estoque') {
      doc.setTextColor(0, 128, 0); // Verde
    } else if (status === 'Baixo Estoque') {
      doc.setTextColor(200, 150, 0); // Amarelo escuro
    } else {
      doc.setTextColor(200, 0, 0); // Vermelho
    }
    doc.text(status, xPos, yPosition);
    doc.setTextColor(0, 0, 0); // Resetar cor
    xPos += colWidths.status;

    // Localização
    const localizacao =
      estoque.localizacao.nome.length > 25
        ? estoque.localizacao.nome.substring(0, 22) + '...'
        : estoque.localizacao.nome;
    doc.text(localizacao, xPos, yPosition);

    yPosition += 10;

    // Linha separadora entre itens
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
  });

  // ==================== RODAPÉ ====================
  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' },
    );
    doc.text(
      'Estoque Inteligente - Sistema de Gerenciamento',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' },
    );
    doc.setTextColor(0, 0, 0);
  };

  // Adicionar rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Salvar o PDF
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const hoje = new Date();
  const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  doc.save(`${sanitizedFileName}-${timestamp}.pdf`);

  return doc;
};

// ==================== GERADOR DE PDF PARA ORÇAMENTOS ====================

interface OrcamentoPDFGeneratorOptions {
  orcamentos: Orcamento[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

export const generateOrcamentosPDF = async ({
  orcamentos,
  fileName = 'relatorio-orcamentos',
  title = 'RELATÓRIO DE ORÇAMENTOS',
  includeStats = true,
  userName = 'Javascript',
}: OrcamentoPDFGeneratorOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ==================== CABEÇALHO ====================
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Data e hora de geração
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' },
  );
  doc.text(`Gerado por: ${userName}`, pageWidth / 2, yPosition + 6, {
    align: 'center',
  });
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // ==================== ESTATÍSTICAS ====================
  if (includeStats && orcamentos.length > 0) {
    const totalOrcamentos = orcamentos.length;
    const valorTotal = orcamentos.reduce((acc, orc) => acc + orc.total, 0);
    const valorMedio = valorTotal / totalOrcamentos;
    const maiorOrcamento = Math.max(...orcamentos.map((orc) => orc.total));
    const menorOrcamento = Math.min(...orcamentos.map((orc) => orc.total));
    const totalItens = orcamentos.reduce(
      (acc, orc) => acc + orc.itens.length,
      0,
    );

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO ESTATÍSTICO', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const stats = [
      `Total de Orçamentos: ${totalOrcamentos}`,
      `Valor Total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Valor Médio: R$ ${valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Maior Orçamento: R$ ${maiorOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Menor Orçamento: R$ ${menorOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Total de Itens: ${totalItens}`,
    ];

    stats.forEach((stat) => {
      doc.text(stat, margin + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  }

  // ==================== TABELA DE ORÇAMENTOS ====================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTOS SELECIONADOS', margin, yPosition);
  yPosition += 8;

  // Cabeçalho da tabela
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');

  const colWidths = {
    codigo: 25,
    nome: 60,
    itens: 25,
    valor: 30,
    data: 30,
  };

  let xPos = margin + 2;
  doc.text('CÓDIGO', xPos, yPosition);
  xPos += colWidths.codigo;
  doc.text('NOME', xPos, yPosition);
  xPos += colWidths.nome;
  doc.text('ITENS', xPos, yPosition);
  xPos += colWidths.itens;
  doc.text('VALOR TOTAL', xPos, yPosition);
  xPos += colWidths.valor;
  doc.text('DATA', xPos, yPosition);
  yPosition += 7;

  // Linha abaixo do cabeçalho
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Dados da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  orcamentos.forEach((orcamento, index) => {
    checkPageBreak(15);

    // Fundo alternado para linhas
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
    }

    xPos = margin + 2;

    // Código (últimos 8 caracteres)
    const codigo = orcamento._id.slice(-8);
    doc.text(codigo, xPos, yPosition);
    xPos += colWidths.codigo;

    // Nome do orçamento (truncado se necessário)
    const nomeOrcamento =
      orcamento.nome.length > 35
        ? orcamento.nome.substring(0, 32) + '...'
        : orcamento.nome;
    doc.text(nomeOrcamento, xPos, yPosition);
    xPos += colWidths.nome;

    // Número de itens
    doc.text(orcamento.itens.length.toString(), xPos, yPosition);
    xPos += colWidths.itens;

    // Valor total
    doc.setTextColor(0, 100, 0); // Verde para valor
    doc.text(
      `R$ ${orcamento.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      xPos,
      yPosition,
    );
    doc.setTextColor(0, 0, 0); // Resetar cor
    xPos += colWidths.valor;

    // Data de criação
    const dataCriacao = orcamento.createdAt
      ? new Date(orcamento.createdAt).toLocaleDateString('pt-BR')
      : '-';
    doc.text(dataCriacao, xPos, yPosition);

    yPosition += 10;

    // Linha separadora entre itens
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
  });

  // ==================== RODAPÉ ====================
  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' },
    );
    doc.text(
      'Estoque Inteligente - Sistema de Gerenciamento',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' },
    );
    doc.setTextColor(0, 0, 0);
  };

  // Adicionar rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Salvar o PDF
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const hoje = new Date();
  const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  doc.save(`${sanitizedFileName}-${timestamp}.pdf`);

  return doc;
};

// ==================== GERADOR DE PDF PARA MOVIMENTAÇÕES ====================

interface Movimentacao {
  _id: string;
  item?: { _id?: string; nome?: string };
  quantidade?: number;
  tipo?: string;
  localizacao?: { nome?: string };
  data_hora?: string;
}

interface MovimentacoesPDFOptions {
  movimentacoes: Movimentacao[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

export const generateMovimentacoesPDF = async ({
  movimentacoes,
  fileName = 'relatorio-movimentacoes',
  title = 'RELATÓRIO DE MOVIMENTAÇÕES',
  includeStats = true,
  userName = 'Administrador',
}: MovimentacoesPDFOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ==================== CABEÇALHO ====================
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Data e hora de geração
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' },
  );
  doc.text(`Gerado por: ${userName}`, pageWidth / 2, yPosition + 6, {
    align: 'center',
  });
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // ==================== ESTATÍSTICAS ====================
  if (includeStats) {
    const totalMovimentacoes = movimentacoes.length;
    const entradas = movimentacoes.filter((m) =>
      String(m.tipo).toLowerCase().includes('entrada'),
    ).length;
    const saidas = movimentacoes.filter(
      (m) =>
        String(m.tipo).toLowerCase().includes('saída') ||
        String(m.tipo).toLowerCase().includes('saida'),
    ).length;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO ESTATÍSTICO', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const stats = [
      `Total de Movimentações: ${totalMovimentacoes}`,
      `Entradas: ${entradas}`,
      `Saídas: ${saidas}`,
    ];

    stats.forEach((stat) => {
      doc.text(stat, margin + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  }

  // ==================== TABELA DE MOVIMENTAÇÕES ====================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MOVIMENTAÇÕES SELECIONADAS', margin, yPosition);
  yPosition += 8;

  // Cabeçalho da tabela
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');

  const colWidths = {
    codigo: 25,
    produto: 50,
    quantidade: 18,
    tipo: 22,
    localizacao: 35,
    data: 30,
  };

  let xPos = margin + 2;
  doc.text('CÓDIGO', xPos, yPosition);
  xPos += colWidths.codigo;
  doc.text('PRODUTO', xPos, yPosition);
  xPos += colWidths.produto;
  doc.text('QTD', xPos, yPosition);
  xPos += colWidths.quantidade;
  doc.text('TIPO', xPos, yPosition);
  xPos += colWidths.tipo;
  doc.text('LOCALIZAÇÃO', xPos, yPosition);
  xPos += colWidths.localizacao;
  doc.text('DATA/HORA', xPos, yPosition);
  yPosition += 7;

  // Linha abaixo do cabeçalho
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Dados da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  movimentacoes.forEach((mov, index) => {
    checkPageBreak(15);

    // Fundo alternado para linhas
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
    }

    xPos = margin + 2;

    // Código (últimos 8 caracteres)
    const codigo = mov.item?._id?.slice(-8) || mov._id?.slice(-8) || '-';
    doc.text(codigo, xPos, yPosition);
    xPos += colWidths.codigo;

    // Produto (nome do item - truncado se necessário)
    const nomeProduto = mov.item?.nome || '-';
    const produtoTrunc =
      nomeProduto.length > 30
        ? nomeProduto.substring(0, 27) + '...'
        : nomeProduto;
    doc.text(produtoTrunc, xPos, yPosition);
    xPos += colWidths.produto;

    // Quantidade
    doc.text(String(mov.quantidade ?? '-'), xPos, yPosition);
    xPos += colWidths.quantidade;

    // Tipo com cor
    const tipoRaw = String(mov.tipo ?? '').toLowerCase();
    const isEntrada = tipoRaw.includes('entrada');
    const isSaida = tipoRaw.includes('saída') || tipoRaw.includes('saida');
    const tipoFormatado = isEntrada
      ? 'Entrada'
      : isSaida
        ? 'Saída'
        : mov.tipo || '-';

    if (isEntrada) {
      doc.setTextColor(0, 128, 0); // Verde
    } else if (isSaida) {
      doc.setTextColor(200, 100, 0); // Laranja
    }
    doc.text(tipoFormatado, xPos, yPosition);
    doc.setTextColor(0, 0, 0); // Resetar cor
    xPos += colWidths.tipo;

    // Localização
    const localizacao = mov.localizacao?.nome || '-';
    const locTrunc =
      localizacao.length > 25
        ? localizacao.substring(0, 22) + '...'
        : localizacao;
    doc.text(locTrunc, xPos, yPosition);
    xPos += colWidths.localizacao;

    // Data/Hora
    const dataStr = mov.data_hora
      ? new Date(mov.data_hora).toLocaleDateString('pt-BR') +
        ' ' +
        new Date(mov.data_hora).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';
    doc.text(dataStr, xPos, yPosition);

    yPosition += 10;

    // Linha separadora entre itens
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
  });

  // ==================== RODAPÉ ====================
  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' },
    );
    doc.text(
      'Estoque Inteligente - Sistema de Gerenciamento',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' },
    );
    doc.setTextColor(0, 0, 0);
  };

  // Adicionar rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Salvar o PDF
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const hoje = new Date();
  const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  doc.save(`${sanitizedFileName}-${timestamp}.pdf`);

  return doc;
};
