'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RelatoriosPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente para a primeira opção de relatórios
    router.replace('/relatorios/itens');
  }, [router]);

  return null;
}
