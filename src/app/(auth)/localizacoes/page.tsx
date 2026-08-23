import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import PageLocalizacoesContent from './_components/localizacoes-client';
import type { LocalizacaoApiResponse } from '@/types/itens';

export default async function PageLocalizacoes() {
  const initialData = await serverFetch<LocalizacaoApiResponse>(
    '/localizacoes?limite=20&page=1',
  );

  return (
    <Suspense>
      <PageLocalizacoesContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
