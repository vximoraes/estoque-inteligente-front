import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import ItensPageContent from './_components/itens-client';
import type { ApiResponse } from '@/types/itens';

export default async function ItensPage() {
  const initialData = await serverFetch<ApiResponse>('/itens?limite=15&page=1');

  return (
    <Suspense>
      <ItensPageContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
