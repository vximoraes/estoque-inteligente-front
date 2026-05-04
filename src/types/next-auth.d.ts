import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      accessToken: string;
      refreshToken: string;
      ativo: boolean;
      fotoPerfil?: string;
    } & DefaultSession['user'];
    error?: 'RefreshAccessTokenError';
  }

  interface User {
    id: string;
    name: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
    ativo?: boolean;
    fotoPerfil?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    ativo: boolean;
    fotoPerfil?: string;
    accessTokenExpires?: number;
    error?: 'RefreshAccessTokenError';
  }
}
