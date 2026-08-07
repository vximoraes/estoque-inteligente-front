import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import PageOrcamentosContent from './_components/orcamentos-client';
import type { OrcamentoApiResponse } from '@/types/orcamentos';

export default async function PageOrcamentos() {
  const initialData = await serverFetch<OrcamentoApiResponse>(
    '/orcamentos?limite=20&page=1',
  );

  return (
    <Suspense>
      <PageOrcamentosContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
