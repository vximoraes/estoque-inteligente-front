import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import PageCategoriasContent from './_components/categorias-client';
import type { CategoriaApiResponse } from '@/types/categorias';

export default async function PageCategorias() {
  const initialData = await serverFetch<CategoriaApiResponse>(
    '/categorias?tipo=permanente&limite=20&page=1',
  );

  return (
    <Suspense>
      <PageCategoriasContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
