import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/layout/header';
import { QueryProvider } from '@/providers/queryProvider';
import { ThemeProvider } from '@/providers/themeProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                <Header />
                <main className="w-full max-w-full overflow-hidden">
                  {children}
                </main>
              </QueryProvider>
            </NuqsAdapter>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
