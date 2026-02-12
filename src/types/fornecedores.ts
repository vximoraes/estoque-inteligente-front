export interface Fornecedor {
  _id: string;
  nome: string;
  url?: string;
  contato?: string;
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FornecedorApiResponse {
  success: boolean;
  data: {
    docs: Fornecedor[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
  message?: string;
}
