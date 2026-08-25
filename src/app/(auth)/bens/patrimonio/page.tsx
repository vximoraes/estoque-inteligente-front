import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import PatrimonioPageContent from './_components/patrimonio-client';
import type { ItemPermanenteApiResponse } from '@/types/itens';

export default async function PatrimonioPage() {
  const initialData = await serverFetch<ItemPermanenteApiResponse>(
    '/itens?tipo=permanente&limite=15&page=1',
  );

  return (
    <Suspense>
      <PatrimonioPageContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
