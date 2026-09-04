import jsPDF from 'jspdf';

export interface ColunaRelatorio<T> {
  header: string;
  width?: number;
  get: (linha: T) => string;
  cor?: (linha: T) => [number, number, number] | undefined;
}

export interface StatRelatorio {
  label: string;
  value: string | number;
}

function sanitizarNomeArquivo(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const hoje = new Date();
  const timestamp = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return `${sanitized}-${timestamp}`;
}

interface GerarTabelaPDFOptions<T> {
  titulo: string;
  fileName: string;
  colunas: ColunaRelatorio<T>[];
  linhas: T[];
  stats?: StatRelatorio[];
  userName?: string;
  nomeSecaoTabela?: string;
}

export function gerarTabelaPDF<T>({
  titulo,
  fileName,
  colunas,
  linhas,
  stats,
  userName = 'Administrador',
  nomeSecaoTabela = 'ITENS SELECIONADOS',
}: GerarTabelaPDFOptions<T>) {
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
  doc.text(titulo, pageWidth / 2, yPosition, { align: 'center' });
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
  if (stats && stats.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO ESTATÍSTICO', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    stats.forEach(({ label, value }) => {
      doc.text(`${label}: ${value}`, margin + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  }

  // ==================== TABELA ====================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(nomeSecaoTabela, margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');

  let xPos = margin + 2;
  colunas.forEach((coluna) => {
    doc.text(coluna.header, xPos, yPosition);
    xPos += coluna.width ?? 30;
  });
  yPosition += 7;

  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  linhas.forEach((linha, index) => {
    checkPageBreak(15);

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
    }

    xPos = margin + 2;
    colunas.forEach((coluna) => {
      const largura = coluna.width ?? 30;
      const valorBruto = coluna.get(linha);
      const maxChars = Math.floor(largura / 1.8);
      const valor =
        valorBruto.length > maxChars
          ? `${valorBruto.substring(0, maxChars - 3)}...`
          : valorBruto;

      const cor = coluna.cor?.(linha);
      if (cor) doc.setTextColor(...cor);
      doc.text(valor, xPos, yPosition);
      if (cor) doc.setTextColor(0, 0, 0);

      xPos += largura;
    });

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

  doc.save(`${sanitizarNomeArquivo(fileName)}.pdf`);
  return doc;
}

// Prevenir injeção de fórmula em CSV (=, +, -, @, tab) — mesma defesa que já
// existia nos geradores originais.
function escapeCSV(text: string): string {
  if (!text) return '';
  let escaped = text.replace(/"/g, '""');
  escaped = escaped.replace(/\n/g, ' ').replace(/\r/g, '');
  if (/^[=+\-@\t]/.test(escaped)) {
    escaped = `'${escaped}`;
  }
  return escaped;
}

interface GerarTabelaCSVOptions<T> {
  titulo: string;
  fileName: string;
  colunas: ColunaRelatorio<T>[];
  linhas: T[];
  stats?: StatRelatorio[];
  nomeSecaoTabela?: string;
}

export function gerarTabelaCSV<T>({
  titulo,
  fileName,
  colunas,
  linhas,
  stats,
  nomeSecaoTabela = 'ITENS SELECIONADOS',
}: GerarTabelaCSVOptions<T>) {
  const lines: string[] = [];

  lines.push(titulo);
  lines.push(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
  );
  lines.push('');

  if (stats && stats.length > 0 && linhas.length > 0) {
    lines.push('RESUMO ESTATÍSTICO');
    stats.forEach(({ label, value }) => lines.push(`${label},${value}`));
    lines.push('');
  }

  lines.push(nomeSecaoTabela);
  lines.push(colunas.map((coluna) => coluna.header).join(','));

  linhas.forEach((linha) => {
    const row = colunas.map((coluna) => `"${escapeCSV(coluna.get(linha))}"`);
    lines.push(row.join(','));
  });

  lines.push('');
  lines.push(`Total de registros exportados: ${linhas.length}`);
  lines.push('Estoque Inteligente - Sistema de Gerenciamento');

  const csvContent = lines.join('\n');
  const blob = new Blob(['﻿' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${sanitizarNomeArquivo(fileName)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function formatarDataHora(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
