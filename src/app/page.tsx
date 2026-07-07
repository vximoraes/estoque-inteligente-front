import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010';

export default async function Home() {
  try {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get('cookie') ?? '';
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (response.ok) {
      const session = await response.json();
      if (session?.user?.id) {
        redirect('/itens');
      }
    }
  } catch {
    // API indisponível → redireciona para login
  }

  redirect('/login');
}
