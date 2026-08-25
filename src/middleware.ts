import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/cadastro',
  '/ativar-conta',
  '/esqueci-senha',
  '/redefinir-senha',
];

const GUEST_ONLY_ROUTES = ['/login', '/cadastro'];

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

  let isAuth = false;
  try {
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
    });
    if (response.ok) {
      const session = await response.json();
      isAuth = !!session?.user?.id;
    }
  } catch {
    isAuth = false;
  }

  if (isGuestOnlyRoute && isAuth) {
    return NextResponse.redirect(new URL('/bens/patrimonio', req.url));
  }

  if (!isPublicRoute && !isAuth) {
    let from = pathname;
    if (req.nextUrl.search) from += req.nextUrl.search;
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url),
    );
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)',
  ],
};
