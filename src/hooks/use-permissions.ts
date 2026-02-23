import { useSession } from '@/hooks/use-session';
import { useEffect, useState } from 'react';
import { get } from '@/lib/fetchData';

export function usePermissions() {
  const { user } = useSession();
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const storedPermissions = localStorage.getItem('user_permissions');
        const storedGroups = localStorage.getItem('user_groups');

        if (storedPermissions && storedGroups) {
          setPermissoes(JSON.parse(storedPermissions));
          setGrupos(JSON.parse(storedGroups));
          setLoading(false);
          return;
        }

        const response = await get<any>(`/usuarios/${user.id}`);
        if (response?.data) {
          const userPermissions = response.data.permissoes || [];
          const userGroups = response.data.grupos || [];

          setPermissoes(userPermissions);
          setGrupos(userGroups);

          localStorage.setItem(
            'user_permissions',
            JSON.stringify(userPermissions),
          );
          localStorage.setItem('user_groups', JSON.stringify(userGroups));
        }
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user?.id]);

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
    loading,
  };
}
