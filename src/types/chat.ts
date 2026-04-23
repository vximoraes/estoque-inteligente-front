export interface Mensagem {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: string;
}

export interface ConversaResumo {
  _id: string;
  titulo: string;
  atualizada_em: string;
  criada_em: string;
}

export interface Conversa extends ConversaResumo {
  mensagens: Mensagem[];
}

export interface PaginatedConversas {
  docs: ConversaResumo[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
