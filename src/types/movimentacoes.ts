import type { ApiEnvelope, Localizacao } from './itens';

export type MovimentacaoTipo = 'entrada' | 'saida';

interface MovimentacaoItemRef {
  _id: string;
  nome: string;
}

interface MovimentacaoUsuarioRef {
  _id: string;
  nome: string;
  email: string;
}

export interface Movimentacao {
  _id: string;
  tipo: MovimentacaoTipo;
  data_hora: string;
  quantidade: number;
  item: MovimentacaoItemRef;
  localizacao: Localizacao;
  usuario: MovimentacaoUsuarioRef;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export type MovimentacaoApiResponse = ApiEnvelope<Movimentacao>;

export interface MovimentacaoResumo {
  total_movimentacoes: number;
  entradas: number;
  saidas: number;
  quantidade_entrada: number;
  quantidade_saida: number;
  saldo: number;
}

export interface MovimentacaoResumoApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: MovimentacaoResumo;
  errors: unknown[];
}

export interface MovimentacaoTendenciaPonto {
  mes: string;
  entradas: number;
  saidas: number;
  quantidade_entrada: number;
  quantidade_saida: number;
}

export interface EmprestimoTendenciaPonto {
  mes: string;
  emprestimos: number;
  devolucoes: number;
}

export interface ListaApiResponse<T> {
  error: boolean;
  code: number;
  message: string;
  data: T[];
  errors: unknown[];
}
