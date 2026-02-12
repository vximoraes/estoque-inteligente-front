import type { Metadata } from "next";
import Header from "@/components/header/header";
import { QueryProvider } from "@/providers/queryProvider";
import { SessionProvider } from "@/providers/sessionProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import "./globals.css";

export const metadata: Metadata = {
  title: "Estoque Inteligente",
  description: "Sistema de gerenciamento inteligente de componentes eletrônicos",
  icons: {
    icon: "/ei.png",
    shortcut: "/ei.png",
    apple: "/ei.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className="flex justify-center"
      >
        <SessionProvider>
          <SidebarProvider>
            <Header />
            <main className="w-full max-w-full overflow-hidden">
              <NuqsAdapter>
                <QueryProvider>
                  {children}
                </QueryProvider>
              </NuqsAdapter>
            </main>
          </SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
