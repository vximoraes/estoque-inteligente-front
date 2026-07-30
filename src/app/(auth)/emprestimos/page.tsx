import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import EmprestimosPageContent from './_components/emprestimos-client';
import type { EmprestimosApiResponse } from '@/types/emprestimos';

export default async function EmprestimosPage() {
  const initialData = await serverFetch<EmprestimosApiResponse>(
    '/emprestimos?limite=20&page=1',
  );

  return (
    <Suspense>
      <EmprestimosPageContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
