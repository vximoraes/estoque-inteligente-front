import jsPDF from 'jspdf';
import { EstoqueData } from '@/types/itens';
import { Emprestimo } from '@/types/emprestimos';

interface PDFGeneratorOptions {
  estoques: EstoqueData[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

export const generateAlmoxarifadoPDF = async ({
  estoques,
  fileName = 'relatorio-almoxarifado',
  title = 'RELATÓRIO DE ALMOXARIFADO',
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

  // ==================== TABELA DE ITENS ====================
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

// ==================== GERADOR DE PDF PARA EMPRÉSTIMOS ====================

interface EmprestimosPDFGeneratorOptions {
  emprestimos: Emprestimo[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userName?: string;
}

export const generateEmprestimosPDF = async ({
  emprestimos,
  fileName = 'relatorio-emprestimos',
  title = 'RELATÓRIO DE EMPRÉSTIMOS',
  includeStats = true,
  userName = 'Administrador',
}: EmprestimosPDFGeneratorOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

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

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // ==================== ESTATÍSTICAS ====================
  if (includeStats) {
    const total = emprestimos.length;
    const ativos = emprestimos.filter((e) => e.status === 'Ativo').length;
    const atrasados = emprestimos.filter((e) => e.status === 'Atrasado').length;
    const devolvidos = emprestimos.filter(
      (e) => e.status === 'Devolvido',
    ).length;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO ESTATÍSTICO', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const stats = [
      `Total de Empréstimos: ${total}`,
      `Ativos: ${ativos}`,
      `Atrasados: ${atrasados}`,
      `Devolvidos: ${devolvidos}`,
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

  // ==================== TABELA DE EMPRÉSTIMOS ====================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPRÉSTIMOS SELECIONADOS', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');

  const colWidths = {
    produto: 45,
    solicitante: 40,
    quantidade: 18,
    status: 25,
    dataSaida: 30,
    dataPrevista: 30,
  };

  let xPos = margin + 2;
  doc.text('PRODUTO', xPos, yPosition);
  xPos += colWidths.produto;
  doc.text('SOLICITANTE', xPos, yPosition);
  xPos += colWidths.solicitante;
  doc.text('QTD', xPos, yPosition);
  xPos += colWidths.quantidade;
  doc.text('STATUS', xPos, yPosition);
  xPos += colWidths.status;
  doc.text('SAÍDA', xPos, yPosition);
  xPos += colWidths.dataSaida;
  doc.text('PREVISÃO', xPos, yPosition);
  yPosition += 7;

  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  emprestimos.forEach((emp, index) => {
    checkPageBreak(15);

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
    }

    xPos = margin + 2;

    const nomeProduto = emp.item?.nome || '-';
    const produtoTrunc =
      nomeProduto.length > 28
        ? nomeProduto.substring(0, 25) + '...'
        : nomeProduto;
    doc.text(produtoTrunc, xPos, yPosition);
    xPos += colWidths.produto;

    const solicitante = emp.solicitante_nome || '-';
    const solicitanteTrunc =
      solicitante.length > 25
        ? solicitante.substring(0, 22) + '...'
        : solicitante;
    doc.text(solicitanteTrunc, xPos, yPosition);
    xPos += colWidths.solicitante;

    doc.text(String(emp.quantidade_emprestada ?? '-'), xPos, yPosition);
    xPos += colWidths.quantidade;

    if (emp.status === 'Ativo') {
      doc.setTextColor(0, 128, 0);
    } else if (emp.status === 'Atrasado') {
      doc.setTextColor(200, 0, 0);
    } else {
      doc.setTextColor(100, 100, 100);
    }
    doc.text(emp.status, xPos, yPosition);
    doc.setTextColor(0, 0, 0);
    xPos += colWidths.status;

    const dataSaida = emp.data_saida
      ? new Date(emp.data_saida).toLocaleDateString('pt-BR')
      : '-';
    doc.text(dataSaida, xPos, yPosition);
    xPos += colWidths.dataSaida;

    const dataPrevista = emp.data_prevista_devolucao
      ? new Date(emp.data_prevista_devolucao).toLocaleDateString('pt-BR')
      : 'Sem previsão';
    doc.text(dataPrevista, xPos, yPosition);

    yPosition += 10;

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

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const hoje = new Date();
  const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  doc.save(`${sanitizedFileName}-${timestamp}.pdf`);

  return doc;
};
