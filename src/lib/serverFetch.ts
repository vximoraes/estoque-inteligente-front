import { headers } from 'next/headers';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function serverFetch<T>(path: string): Promise<T | null> {
  if (!API_URL) return null;

  try {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get('cookie') ?? '';

    const response = await fetch(`${API_URL}${path}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}
