import { NextRequest, NextResponse } from 'next/server';
import { HEADER_FUSO } from '@/lib/datas';

const PUBLIC_ROUTES = [
  '/login',
  '/ativar-conta',
  '/esqueci-senha',
  '/redefinir-senha',
];

const GUEST_ONLY_ROUTES = ['/login'];

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3010';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const cookie = req.headers.get('cookie') ?? '';
  const temCookieDeSessao = cookie.includes('session_token');

  let isAuth = false;
  let apiIndisponivel = false;
  let fusoHorario = '';
  if (temCookieDeSessao) {
    try {
      const response = await fetch(`${API_URL}/api/auth/get-session`, {
        headers: { cookie },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const session = await response.json();
        isAuth = !!session?.user?.id;
        fusoHorario = session?.user?.fuso_horario ?? '';
      } else if (response.status >= 500) {
        apiIndisponivel = true;
      }
    } catch {
      apiIndisponivel = true;
    }
  }

  if (isGuestOnlyRoute && isAuth) {
    return NextResponse.redirect(new URL('/bens/patrimonio', req.url));
  }

  if (!isPublicRoute && !isAuth) {
    let from = pathname;
    if (req.nextUrl.search) from += req.nextUrl.search;
    const aviso = apiIndisponivel ? '&indisponivel=1' : '';
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}${aviso}`, req.url),
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(HEADER_FUSO, fusoHorario);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)',
  ],
};
