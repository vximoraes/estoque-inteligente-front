import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import PageFornecedoresContent from './_components/fornecedores-client';
import type { FornecedorApiResponse } from '@/types/fornecedores';

export default async function PageFornecedores() {
  const initialData = await serverFetch<FornecedorApiResponse>(
    '/fornecedores?limite=20&page=1',
  );

  return (
    <Suspense>
      <PageFornecedoresContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
