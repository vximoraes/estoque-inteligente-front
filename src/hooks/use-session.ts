'use client';

import { authClient } from '@/lib/auth-client';

export function useSession() {
  const { data, isPending } = authClient.useSession();

  return {
    session: data,
    user: data?.user,
    isAuthenticated: !!data?.user,
    isLoading: isPending,
  };
}
