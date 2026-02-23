export interface ItemOrcamento {
  _id?: string;
  item: string;
  nome: string;
  fornecedor: string;
  fornecedor_nome?: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

export interface Orcamento {
  _id: string;
  nome: string;
  descricao?: string;
  total: number;
  itens: ItemOrcamento[];
  usuario: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrcamentoApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: Orcamento[];
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
  errors: any[];
}

export interface OrcamentoSingleApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: Orcamento;
  errors: any[];
}
