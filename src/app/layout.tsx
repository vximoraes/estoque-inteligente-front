import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/layout/header';
import { QueryProvider } from '@/providers/queryProvider';
import { ThemeProvider } from '@/providers/themeProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import SincronizarFusoHorario from '@/components/layout/sincronizar-fuso-horario';
import { HEADER_FUSO, fusoValido } from '@/lib/datas';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Estoque Inteligente',
  description: 'Sistema de gerenciamento inteligente de estoque',
  icons: {
    icon: '/estoque-inteligente-logo.png',
    shortcut: '/estoque-inteligente-logo.png',
    apple: '/estoque-inteligente-logo.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fusoDoUsuario = (await headers()).get(HEADER_FUSO);
  const fuso = fusoValido(fusoDoUsuario) ? fusoDoUsuario : 'UTC';

  return (
    <html
      lang="pt-BR"
      className={plusJakartaSans.variable}
      suppressHydrationWarning
    >
      <body className="flex justify-center">
        <ThemeProvider>
          <SidebarProvider>
            <NuqsAdapter>
              <QueryProvider>
                <SincronizarFusoHorario fuso={fuso}>
                  <Header />
                  <main className="w-full max-w-full overflow-hidden">
                    {children}
                  </main>
                </SincronizarFusoHorario>
              </QueryProvider>
            </NuqsAdapter>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
