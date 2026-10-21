import type { NextConfig } from 'next';

function origem(url: string | undefined) {
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}

function politicaDeConteudo() {
  const api = origem(process.env.NEXT_PUBLIC_API_URL);
  return [
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `connect-src 'self' ${api}`.trim(),
  ].join('; ');
}

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    const cabecalhos = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
    ];
    if (process.env.NODE_ENV === 'production') {
      cabecalhos.push({
        key: 'Content-Security-Policy',
        value: politicaDeConteudo(),
      });
    }
    return [{ source: '/(.*)', headers: cabecalhos }];
  },
};

export default nextConfig;
