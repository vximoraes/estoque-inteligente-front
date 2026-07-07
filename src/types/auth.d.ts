// Extensão dos tipos de sessão do Better Auth com campos adicionais da API
declare module 'better-auth/types' {
  interface User {
    ativo?: boolean;
    fotoPerfil?: string | null;
  }
}
