import { Suspense } from 'react';
import { serverFetch } from '@/lib/serverFetch';
import PageUsuariosContent from './_components/usuarios-client';

interface UsuarioApiResponse {
  error: boolean;
  message: string;
  data: {
    docs: {
      _id: string;
      nome: string;
      email: string;
      ativo: boolean;
      convidadoEm?: string;
      ativadoEm?: string;
    }[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    nextPage: number | null;
  };
}

export default async function PageUsuarios() {
  const initialData = await serverFetch<UsuarioApiResponse>('/usuarios?limite=20&page=1');

  return (
    <Suspense>
      <PageUsuariosContent initialData={initialData ?? undefined} />
    </Suspense>
  );
}
