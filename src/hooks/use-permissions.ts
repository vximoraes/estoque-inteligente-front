import { useSession } from '@/hooks/use-session';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';

export function usePermissions() {
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      const response = await get<any>(`/usuarios/${user!.id}`);
      return {
        permissoes: response?.data?.permissoes || [],
        grupos: response?.data?.grupos || [],
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const permissoes = data?.permissoes || [];
  const grupos = data?.grupos || [];

  const hasPermission = (
    rota: string,
    action?: 'buscar' | 'enviar' | 'substituir' | 'modificar' | 'excluir',
  ): boolean => {
    if (!permissoes || !Array.isArray(permissoes)) {
      return false;
    }

    const permission = permissoes.find((p: any) => p.rota === rota);

    if (!permission) {
      return false;
    }

    if (!action) {
      return permission.ativo === true;
    }

    return permission.ativo === true && permission[action] === true;
  };

  const isAdmin = (): boolean => {
    return (
      hasPermission('usuarios', 'buscar') ||
      hasPermission('usuarios', 'enviar') ||
      grupos?.some((grupo: string) => grupo.toLowerCase().includes('admin'))
    );
  };

  const canManageUsers = (): boolean => {
    return hasPermission('usuarios');
  };

  return {
    hasPermission,
    isAdmin,
    canManageUsers,
    permissoes,
    grupos,
    loading: isLoading,
  };
}
