// Sugestão de próximo número de patrimônio a partir das unidades já
// existentes de um item — usado no cadastro individual para poupar o
// usuário de digitar `NB-0007` de cabeça. Extraído de
// `modal-patrimonio-adicionar-unidades.tsx` (cadastro em lote) para ser
// reaproveitado também no cadastro unidade a unidade.

import type { PatrimonioData } from '@/types/patrimonios';

export function prefixoMaisComum(unidades: PatrimonioData[]) {
  const contagem = new Map<string, number>();
  for (const u of unidades) {
    const prefixo = u.numero_patrimonio.split('-')[0] ?? '';
    if (!prefixo) continue;
    contagem.set(prefixo, (contagem.get(prefixo) ?? 0) + 1);
  }
  let melhor = '';
  let max = 0;
  for (const [prefixo, qtd] of contagem) {
    if (qtd > max) {
      melhor = prefixo;
      max = qtd;
    }
  }
  return melhor;
}

export function proximoNumero(unidades: PatrimonioData[], prefixo: string) {
  const alvo = prefixo.trim().toUpperCase();
  let maior = 0;
  for (const u of unidades) {
    const [p, sufixo] = u.numero_patrimonio.split('-');
    if (p !== alvo) continue;
    const n = parseInt(sufixo ?? '', 10);
    if (!Number.isNaN(n) && n > maior) maior = n;
  }
  return maior + 1;
}

export function sugerirNumeroPatrimonio(unidades: PatrimonioData[]) {
  const prefixo = prefixoMaisComum(unidades);
  if (!prefixo) return '';
  const numero = proximoNumero(unidades, prefixo);
  return `${prefixo}-${String(numero).padStart(4, '0')}`;
}
