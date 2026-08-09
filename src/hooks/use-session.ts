'use client';

import { authClient } from '@/lib/auth-client';

export function useSession() {
  const { data, isPending, refetch } = authClient.useSession();

  return {
    session: data,
    user: data?.user,
    isAuthenticated: !!data?.user,
    isLoading: isPending,
    refetch,
  };
}
