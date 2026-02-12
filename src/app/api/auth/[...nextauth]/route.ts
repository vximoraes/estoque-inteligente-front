import NextAuth, { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

function parseTimeToMs(timeString: string): number {
  const units: { [key: string]: number } = {
    's': 1000,           
    'm': 60 * 1000,      
    'h': 60 * 60 * 1000, 
    'd': 24 * 60 * 60 * 1000 
  };

  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    console.warn(`Formato de tempo inválido: ${timeString}, usando padrão de 1 hora`);
    return 60 * 60 * 1000; 
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

const ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_TOKEN_EXPIRATION || "1h";
const ACCESS_TOKEN_EXPIRATION_MS = parseTimeToMs(ACCESS_TOKEN_EXPIRATION);

const REFRESH_BUFFER_MS = Math.max(2000, ACCESS_TOKEN_EXPIRATION_MS * 0.1);

console.log(`[NextAuth Config] Token expira em: ${ACCESS_TOKEN_EXPIRATION} (${ACCESS_TOKEN_EXPIRATION_MS}ms)`);
console.log(`[NextAuth Config] Buffer de renovação: ${REFRESH_BUFFER_MS}ms`);

interface LoginResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    user: {
      accesstoken: string;
      refreshtoken: string;
      _id: string;
      nome: string;
      email: string;
      senha: string;
      ativo: boolean;
      // permissoes: any[];
      // grupos: string[];
      fotoPerfil?: string;
      __v?: number;
    };
  };
  errors: any[];
}

interface RefreshResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    user: {
      accesstoken: string;
      refreshtoken: string;
      _id: string;
      nome: string;
      email: string;
      ativo: boolean;
      // permissoes: any[];
      // grupos: string[];
      fotoPerfil?: string;
      __v?: number;
    };
  };
  errors: any[];
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    
    console.log("Tentando renovar token...");
    
    const response = await fetch(`${apiUrl}/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.refreshToken}`
      },
      body: JSON.stringify({ accesstoken: token.accessToken }),
    });

    if (!response.ok) {
      console.error("Falha ao renovar token, status:", response.status);
      throw new Error("Falha ao renovar token");
    }

    const json = await response.json() as RefreshResponse;
    const userData = json.data.user;

    console.log("Token renovado com sucesso");

    return {
      ...token,
      accessToken: userData.accesstoken,
      refreshToken: userData.refreshtoken ?? token.refreshToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_EXPIRATION_MS,

      name: userData.nome ?? token.name,
      email: userData.email ?? token.email,
      ativo: userData.ativo ?? token.ativo,
      // permissoes: userData.permissoes ?? token.permissoes,
      // grupos: userData.grupos ?? token.grupos,
      fotoPerfil: userData.fotoPerfil ?? token.fotoPerfil,
    };
  } catch (err) {
    console.error("Erro ao renovar token:", err);
    return { 
      ...token, 
      error: "RefreshAccessTokenError" as const 
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          throw new Error("Email e senha são obrigatórios");
        }

        try {
          const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(`${apiUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              senha: credentials.senha
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData?.message || "Erro ao fazer login");
          }

          const json = await response.json() as LoginResponse;
          const { data } = json;

          if (data?.user) {
            const user: User = {
              id: data.user._id,
              name: data.user.nome,
              email: data.user.email,
              accessToken: data.user.accesstoken,
              refreshToken: data.user.refreshtoken,
              ativo: data.user.ativo,
              // permissoes: data.user.permissoes,
              // grupos: data.user.grupos,
              fotoPerfil: data.user.fotoPerfil,
            };
            return user;
          }

          return null;
        } catch (error) {
          console.error("Erro no login:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao fazer login");
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const expiresAt = Date.now() + ACCESS_TOKEN_EXPIRATION_MS;
        console.log(`[JWT Callback] Novo login - Token expira em: ${new Date(expiresAt).toLocaleString()}`);
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          ativo: (user as any).ativo,
          // permissoes: (user as any).permissoes,
          // grupos: (user as any).grupos,
          fotoPerfil: (user as any).fotoPerfil,
          accessTokenExpires: expiresAt,
        };
      }

      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      const now = Date.now();
      const expiresAt = Number(token.accessTokenExpires ?? 0);
      const timeUntilExpiry = expiresAt - now;
      const shouldRefresh = timeUntilExpiry < REFRESH_BUFFER_MS;

      console.log(`[JWT Callback] Verificando token - Tempo até expirar: ${Math.floor(timeUntilExpiry / 1000)}s, Deve renovar: ${shouldRefresh}`);

      if (!shouldRefresh) {
        return token;
      }

      console.log("[JWT Callback] Token próximo de expirar ou expirado, iniciando renovação automática...");
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
          accessToken: token.accessToken as string,
          refreshToken: token.refreshToken as string,
          ativo: token.ativo as boolean,
          // permissoes: token.permissoes as any[],
          // grupos: token.grupos as string[],
          fotoPerfil: token.fotoPerfil as string | undefined,
        };
      }

      if (token?.error === "RefreshAccessTokenError") {
        session.error = "RefreshAccessTokenError";
      }

      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
    // ,
    // callbackUrl: {
    //   name: `next-auth.callback-url`,
    //   options: {
    //     sameSite: 'lax',
    //     path: '/',
    //     secure: process.env.NODE_ENV === 'production'
    //   }
    // }
    ,
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };