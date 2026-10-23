import { useSession } from '@/hooks/use-session';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';

type AcaoPermissao =
  | 'buscar'
  | 'enviar'
  | 'substituir'
  | 'modificar'
  | 'excluir';

interface PermissaoEfetiva extends Record<AcaoPermissao, boolean> {
  rota: string;
  ativo: boolean;
}

export function usePermissions() {
  const { user, isLoading: sessionLoading } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      const response = await get<{ data: PermissaoEfetiva[] }>(
        `/usuarios/${user!.id}/permissoes`,
      );
      return response?.data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const permissoes = data ?? [];

  const hasPermission = (rota: string, action?: AcaoPermissao): boolean => {
    const permission = permissoes.find((p) => p.rota === rota);

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
      hasPermission('usuarios', 'buscar') || hasPermission('usuarios', 'enviar')
    );
  };

  const canManageUsers = (): boolean => {
    return hasPermission('usuarios', 'buscar');
  };

  return {
    hasPermission,
    isAdmin,
    canManageUsers,
    permissoes,
    // Enquanto a sessão ainda resolve, `user?.id` é undefined e a query de
    // permissões fica `enabled: false` — nesse estado o React Query reporta
    // isLoading=false (não é "carregando", é "desabilitada"), então sem
    // considerar sessionLoading aqui um consumidor que decide algo com base
    // em canManageUsers() (ex.: chamar notFound()) age antes da resposta
    // real chegar.
    loading: sessionLoading || isLoading,
  };
}
