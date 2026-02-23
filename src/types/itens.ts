export interface ItemEstoqueData {
  _id: string;
  nome: string;
  quantidade: number;
  estoque_minimo: number;
  descricao: string;
  imagem: string;
  categoria: {
    _id: string;
    nome: string;
    usuario: string;
    __v: number;
  };
  ativo: boolean;
  usuario: string;
  status: string;
  __v: number;
}

export interface Localizacao {
  _id: string;
  nome: string;
  ativo: boolean;
  usuario: string;
  __v: number;
}

export interface EstoqueData {
  _id: string;
  localizacao: Localizacao;
  item: {
    _id: string;
    nome: string;
    quantidade: number;
    estoque_minimo: number;
    descricao: string;
    imagem: string;
    categoria: string;
    ativo: boolean;
    usuario: string;
    status: string;
    __v: number;
  };
  quantidade: number;
  createdAt: string;
  updatedAt: string;
  usuario: string;
  __v: number;
}

export interface EstoqueApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: EstoqueData[];
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

export interface ApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: ItemEstoqueData[];
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