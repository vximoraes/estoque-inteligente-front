import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import PatrimonioPageContent from './_components/patrimonio-client';
import type { PatrimonioApiResponse } from '@/types/patrimonios';

export default async function PatrimonioPage() {
  const initialData = await serverFetch<PatrimonioApiResponse>(
    '/patrimonios?limite=20&page=1',
  );

  return (
    <Suspense>
      <PatrimonioPageContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
