export interface OpcaoOrdenacao {
  value: string;
  label: string;
}

// value no formato "<campo>:asc|desc", espelhando a whitelist aceita por
// cada módulo da API (ver *_SORT_FIELDS em estoque-inteligente-api).
export const ORDENACAO_FORNECEDORES: OpcaoOrdenacao[] = [
  { value: 'nome:asc', label: 'Nome (A-Z)' },
  { value: 'nome:desc', label: 'Nome (Z-A)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];

export const ORDENACAO_EMPRESTIMOS: OpcaoOrdenacao[] = [
  { value: 'data_saida:desc', label: 'Data de saída (mais recente)' },
  { value: 'data_saida:asc', label: 'Data de saída (mais antiga)' },
  {
    value: 'data_prevista_devolucao:asc',
    label: 'Devolução prevista (mais próxima)',
  },
  {
    value: 'data_prevista_devolucao:desc',
    label: 'Devolução prevista (mais distante)',
  },
  { value: 'solicitante_nome:asc', label: 'Solicitante (A-Z)' },
  { value: 'solicitante_nome:desc', label: 'Solicitante (Z-A)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];

export const ORDENACAO_ORCAMENTOS: OpcaoOrdenacao[] = [
  { value: 'nome:asc', label: 'Nome (A-Z)' },
  { value: 'nome:desc', label: 'Nome (Z-A)' },
  { value: 'total:desc', label: 'Valor (maior primeiro)' },
  { value: 'total:asc', label: 'Valor (menor primeiro)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];

export const ORDENACAO_USUARIOS: OpcaoOrdenacao[] = [
  { value: 'nome:asc', label: 'Nome (A-Z)' },
  { value: 'nome:desc', label: 'Nome (Z-A)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];

export const ORDENACAO_CATEGORIAS: OpcaoOrdenacao[] = [
  { value: 'nome:asc', label: 'Nome (A-Z)' },
  { value: 'nome:desc', label: 'Nome (Z-A)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];

export const ORDENACAO_LOCALIZACOES: OpcaoOrdenacao[] = [
  { value: 'nome:asc', label: 'Nome (A-Z)' },
  { value: 'nome:desc', label: 'Nome (Z-A)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];

export const ORDENACAO_PATRIMONIO: OpcaoOrdenacao[] = [
  { value: 'numero_patrimonio:asc', label: 'Número de patrimônio (A-Z)' },
  { value: 'numero_patrimonio:desc', label: 'Número de patrimônio (Z-A)' },
  { value: 'modelo:asc', label: 'Modelo (A-Z)' },
  { value: 'modelo:desc', label: 'Modelo (Z-A)' },
  { value: 'status:asc', label: 'Status (A-Z)' },
  { value: 'status:desc', label: 'Status (Z-A)' },
  { value: 'data_aquisicao:desc', label: 'Data de aquisição (mais recente)' },
  { value: 'data_aquisicao:asc', label: 'Data de aquisição (mais antiga)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];

export const ORDENACAO_ITENS_CONSUMO: OpcaoOrdenacao[] = [
  { value: 'nome:asc', label: 'Nome (A-Z)' },
  { value: 'nome:desc', label: 'Nome (Z-A)' },
  { value: 'quantidade:desc', label: 'Quantidade (maior primeiro)' },
  { value: 'quantidade:asc', label: 'Quantidade (menor primeiro)' },
  { value: 'createdAt:desc', label: 'Mais recentes' },
  { value: 'createdAt:asc', label: 'Mais antigos' },
];
