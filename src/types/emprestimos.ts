export interface EmprestimoItem {
  _id: string;
  nome: string;
}

export interface EmprestimoLocalizacao {
  _id: string;
  nome: string;
}

export interface EmprestimoUsuarioResponsavel {
  _id: string;
  nome: string;
  email: string;
}

export type EmprestimoStatus = 'Ativo' | 'Atrasado' | 'Devolvido';

export interface Emprestimo {
  _id: string;
  item: EmprestimoItem;
  localizacao: EmprestimoLocalizacao;
  quantidade_emprestada: number;
  quantidade_devolvida: number;
  quantidade_aberta: number;
  solicitante_nome: string;
  solicitante_email?: string;
  data_saida: string;
  data_prevista_devolucao?: string | null;
  data_devolucao_total?: string | null;
  observacoes_emprestimo?: string;
  observacoes_devolucao?: string;
  usuario_responsavel: EmprestimoUsuarioResponsavel;
  ativo: boolean;
  status: EmprestimoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmprestimosApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: Emprestimo[];
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
  errors: Array<{ path?: string; message?: string }>;
}

export interface EmprestimoSingleApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: Emprestimo;
  errors: Array<{ path?: string; message?: string }>;
}
