export type ItemTipo = 'consumo' | 'permanente';

interface ItemCategoriaRef {
  _id: string;
  nome: string;
  usuario: string;
  __v: number;
}

interface ItemBaseData {
  _id: string;
  nome: string;
  quantidade: number;
  descricao: string;
  imagem: string;
  categoria: ItemCategoriaRef;
  ativo: boolean;
  usuario: string;
  __v: number;
}

export interface ItemConsumoData extends ItemBaseData {
  tipo: 'consumo';
  estoque_minimo: number;
  status: 'Em Estoque' | 'Baixo Estoque' | 'Indisponível';
}

// `quantidade_disponivel` é o campo autoritativo de disponibilidade para
// empréstimo: `quantidade` sozinha inclui unidades em Manutenção/Baixado.
export interface ItemPermanenteData extends ItemBaseData {
  tipo: 'permanente';
  quantidade_disponivel: number;
  // O hook `statusDePermanente` no backend nunca emite 'Baixo Estoque' —
  // permanente não tem estoque mínimo.
  status: 'Em Estoque' | 'Indisponível';
}

export type Item = ItemConsumoData | ItemPermanenteData;

export const ITEM_TIPO_LABEL: Record<ItemTipo, string> = {
  consumo: 'Item de almoxarifado',
  permanente: 'Bem permanente',
};

export const ITEM_TIPO_LABEL_CURTO: Record<ItemTipo, string> = {
  consumo: 'Almoxarifado',
  permanente: 'Patrimônio',
};

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
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

export type LocalizacaoApiResponse = ApiEnvelope<Localizacao>;

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

export type ItemConsumoApiResponse = ApiEnvelope<ItemConsumoData>;

// Feed misto (os dois `tipo`), para telas que ainda listam os dois domínios
// juntos — ex. o seletor de item de orçamentos e empréstimos.
export type ItemApiResponse = ApiEnvelope<Item>;
