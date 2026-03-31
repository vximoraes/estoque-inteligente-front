import { Emprestimo } from '@/types/emprestimos';
import jsPDF from 'jspdf';

function fmt(data?: string | null): string {
  if (!data) return '-';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function gerarPdfEmprestimo(emp: Emprestimo): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const col = pageW - margin * 2;
  let y = margin;

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Estoque Inteligente', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text('Termo de Empréstimo de Equipamento', pageW / 2, y, { align: 'center' });
  y += 3;

  doc.setDrawColor(180);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Dados do empréstimo ────────────────────────────────────────────────────
  doc.setTextColor(0);
  doc.setFontSize(10);

  const rows: [string, string][] = [
    ['Item', emp.item?.nome || '-'],
    ['Solicitante', emp.solicitante_nome],
    ['Localização', emp.localizacao?.nome || '-'],
    ['Quantidade emprestada', String(emp.quantidade_emprestada)],
    ['Quantidade devolvida', String(emp.quantidade_devolvida)],
    ['Quantidade em aberto', String(emp.quantidade_aberta)],
    ['Data de saída', fmt(emp.data_saida)],
    ['Previsão de devolução', fmt(emp.data_prevista_devolucao)],
    ['Data de devolução total', fmt(emp.data_devolucao_total)],
    ['Status', emp.status],
  ];

  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value, col - 55);
    doc.text(lines, margin + 58, y);
    y += 6 * lines.length;
  }

  y += 4;
  doc.setDrawColor(180);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Observações ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Observações do empréstimo:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const obsEmp = emp.observacoes_emprestimo?.trim() || '-';
  const obsEmpLines = doc.splitTextToSize(obsEmp, col);
  doc.text(obsEmpLines, margin, y);
  y += 5 * obsEmpLines.length + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Observações da devolução:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const obsDevol = emp.observacoes_devolucao?.trim() || '-';
  const obsDevolLines = doc.splitTextToSize(obsDevol, col);
  doc.text(obsDevolLines, margin, y);
  y += 5 * obsDevolLines.length + 4;

  // ── Data de emissão ────────────────────────────────────────────────────────
  doc.setTextColor(120);
  doc.setFontSize(9);
  doc.text(
    `Documento gerado em: ${new Date().toLocaleString('pt-BR')}`,
    margin,
    y,
  );
  y += 6;

  // ── Assinaturas ────────────────────────────────────────────────────────────
  const signatureY = doc.internal.pageSize.getHeight() - 40;
  const halfW = (pageW - margin * 2) / 2;

  doc.setTextColor(0);
  doc.setDrawColor(0);
  doc.setFontSize(10);

  // Linha esquerda
  doc.line(margin, signatureY, margin + halfW - 10, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text('Responsável pelo empréstimo', margin + (halfW - 10) / 2, signatureY + 5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('(Assinatura Digital)', margin + (halfW - 10) / 2, signatureY + 10, {
    align: 'center',
  });

  // Linha direita
  const rightStart = margin + halfW + 10;
  doc.line(rightStart, signatureY, pageW - margin, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Solicitante', rightStart + (halfW - 10) / 2, signatureY + 5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('(Assinatura Digital)', rightStart + (halfW - 10) / 2, signatureY + 10, {
    align: 'center',
  });

  const nomeArquivo = `emprestimo-${emp.solicitante_nome.replace(/\s+/g, '-').toLowerCase()}-${emp._id.slice(-6)}.pdf`;
  doc.save(nomeArquivo);
}
