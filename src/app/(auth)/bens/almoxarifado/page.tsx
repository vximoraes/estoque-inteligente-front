import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import ConsumoPageContent from './_components/consumo-client';
import type { ItemConsumoApiResponse } from '@/types/itens';

export default async function AlmoxarifadoPage() {
  const initialData = await serverFetch<ItemConsumoApiResponse>(
    '/itens?tipo=consumo&limite=15&page=1',
  );

  return (
    <Suspense>
      <ConsumoPageContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
