'use client';
import { usePathname } from 'next/navigation';
import CustomSidebar from './sidebar';

interface ComponenteReact {
  children?: React.ReactNode;
}

export default function Header({ children }: ComponenteReact) {
  const pathName = usePathname();
  const rotasIgnoradas = [
    '/',
    '/login',
    '/ativar-conta',
    '/esqueci-senha',
    '/redefinir-senha',
  ];

  if (!rotasIgnoradas.includes(pathName)) {
    return <CustomSidebar path={pathName} />;
  }
}
