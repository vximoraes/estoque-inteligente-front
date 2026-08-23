import type { ApiEnvelope } from './itens';

export interface Categoria {
  _id: string;
  nome: string;
  ativo: boolean;
  usuario: string;
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

export type CategoriaApiResponse = ApiEnvelope<Categoria>;
