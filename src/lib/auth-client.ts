import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010',
  plugins: [
    inferAdditionalFields({
      user: {
        ativo: {
          type: 'boolean',
          required: false,
        },
        fotoPerfil: {
          type: 'string',
          required: false,
        },
      },
    }),
  ],
});

export const { signIn, signOut, useSession, getSession } = authClient;
