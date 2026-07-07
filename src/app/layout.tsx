import type { Metadata } from 'next';
import Header from '@/components/header/header';
import { QueryProvider } from '@/providers/queryProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';

export const metadata: Metadata = {
  title: 'Estoque Inteligente',
  description: 'Sistema de gerenciamento inteligente de estoque',
  icons: {
    icon: '/estoque-inteligente-logo.png',
    shortcut: '/estoque-inteligente-logo.png',
    apple: '/estoque-inteligente-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="flex justify-center">
        <SidebarProvider>
          <NuqsAdapter>
            <QueryProvider>
              <Header />
              <main className="w-full max-w-full overflow-hidden">
                {children}
              </main>
            </QueryProvider>
          </NuqsAdapter>
        </SidebarProvider>
      </body>
    </html>
  );
}
