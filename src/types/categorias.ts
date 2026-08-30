import type { ApiEnvelope, ItemTipo } from './itens';

export interface Categoria {
  _id: string;
  nome: string;
  tipo: ItemTipo;
  ativo: boolean;
  usuario: string;
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

export type CategoriaApiResponse = ApiEnvelope<Categoria>;
