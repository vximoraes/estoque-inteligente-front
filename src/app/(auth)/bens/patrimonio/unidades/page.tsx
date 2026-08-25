import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import UnidadesPageContent from './_components/unidades-client';
import type { PatrimonioApiResponse } from '@/types/patrimonios';

export default async function UnidadesPatrimonioPage() {
  const initialData = await serverFetch<PatrimonioApiResponse>(
    '/patrimonios?limite=20&page=1',
  );

  return (
    <Suspense>
      <UnidadesPageContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
