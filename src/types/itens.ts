export interface ItemEstoqueData {
  _id: string;
  nome: string;
  tipo: 'consumo' | 'permanente';
  quantidade: number;
  quantidade_disponivel: number;
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

// Formato de envelope paginado (mongoose-paginate-v2) comum a todas as
// listagens da API. `EstoqueApiResponse`/`ApiResponse` abaixo são casos
// concretos deste formato — reaproveite para novos tipos em vez de copiar.
export interface ApiEnvelope<T> {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: T[];
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

export type EstoqueApiResponse = ApiEnvelope<EstoqueData>;

export type ApiResponse = ApiEnvelope<ItemEstoqueData>;
