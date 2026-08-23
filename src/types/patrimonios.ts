import type { ApiEnvelope, Localizacao } from './itens';

export type PatrimonioStatus =
  | 'Disponível'
  | 'Emprestado'
  | 'Manutenção'
  | 'Baixado';

export interface PatrimonioItemRef {
  _id: string;
  nome: string;
  tipo: 'consumo' | 'permanente';
}

export interface PatrimonioData {
  _id: string;
  item: PatrimonioItemRef;
  numero_patrimonio: string;
  localizacao: Localizacao;
  status: PatrimonioStatus;
  data_aquisicao?: string;
  observacoes?: string;
  ativo: boolean;
  usuario: string;
  createdAt: string;
  updatedAt: string;
}

export type PatrimonioEventoTipo =
  | 'cadastro'
  | 'emprestimo'
  | 'devolucao'
  | 'manutencao_entrada'
  | 'manutencao_saida'
  | 'transferencia'
  | 'baixa'
  | 'reativacao';

export interface PatrimonioEventoData {
  _id: string;
  patrimonio: string;
  item: string;
  tipo: PatrimonioEventoTipo;
  status_anterior: PatrimonioStatus | null;
  status_novo: PatrimonioStatus;
  localizacao_anterior?: { _id: string; nome: string } | null;
  localizacao_nova?: { _id: string; nome: string } | null;
  emprestimo?: string;
  data_hora: string;
  observacoes?: string;
  usuario: { _id: string; nome: string; email?: string } | string;
}

export type PatrimonioApiResponse = ApiEnvelope<PatrimonioData>;
export type PatrimonioEventoApiResponse = ApiEnvelope<PatrimonioEventoData>;
