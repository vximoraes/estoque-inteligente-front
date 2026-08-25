import { redirect } from 'next/navigation';

// Rota legada: /itens era a tela única discriminando por `tipo`, hoje
// dividida em /bens/almoxarifado e /bens/patrimonio. Mantida como redirect
// (preservando busca/categoria/status) para não quebrar links salvos.
export default async function ItensPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tipo = typeof sp.tipo === 'string' ? sp.tipo : undefined;

  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(sp)) {
    if (chave === 'tipo' || typeof valor !== 'string') continue;
    params.append(chave, valor);
  }

  const destino =
    tipo === 'permanente' ? '/bens/patrimonio' : '/bens/almoxarifado';
  const qs = params.toString();
  redirect(qs ? `${destino}?${qs}` : destino);
}
