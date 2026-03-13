'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/ui/sidebar';
import { SidebarMenu } from '@/components/ui/sidebar';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useState, useEffect, useCallback } from 'react';
import SidebarButtonMenu from './sidebarButton';
import SidebarButtonWithSubmenu from './sidebarButtonWithSubmenu';
import { signOut } from 'next-auth/react';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { X, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { usePermissions } from '@/hooks/use-permissions';

interface CustomSidebarProps {
  children?: React.ReactNode;
}

interface PathRouter {
  path: string;
  collapsed?: boolean;
}

interface MobileMenuItemProps {
  icon: string;
  iconHover: string;
  name: string;
  route: string;
  isActive?: boolean;
  onClick: () => void;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  name: string;
  route: string;
}

function MobileMenuItem({
  icon,
  iconHover,
  name,
  route,
  isActive,
  onClick,
  subItems,
}: MobileMenuItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (subItems && subItems.length > 0) {
      setIsOpen(!isOpen);
    } else {
      router.push(route);
      onClick();
    }
  };

  const handleSubItemClick = (subRoute: string) => {
    router.push(subRoute);
    onClick();
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        className={`text-[14px] pl-4 pr-3 py-1 h-10 w-full cursor-pointer flex gap-2 items-center rounded-lg transition-all duration-300 ${
          isActive
            ? 'bg-white text-black shadow-md'
            : 'text-[#B4BAC5] hover:bg-[rgba(255,255,255,0.08)]'
        }`}
      >
        <img
          src={isActive ? iconHover : icon}
          alt={name}
          className="w-[18px] h-[18px]"
        />
        <span
          className={`text-[14px] font-medium flex-1 text-left ${isActive ? 'text-black' : 'text-[#B4BAC5]'}`}
        >
          {name}
        </span>
        {subItems && subItems.length > 0 && (
          <svg
            className={`w-4 h-4 mr-3 transition-all duration-300 rotate-0 ${isOpen ? '-rotate-180' : ''} ${
              isActive || isOpen ? 'opacity-100' : 'opacity-0'
            } ${isActive ? 'text-black' : 'text-[#B4BAC5]'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* Sub-itens */}
      {subItems && subItems.length > 0 && (
        <div
          className={`overflow-hidden transition-all duration-500 ease-out mt-0.5 ${
            isOpen
              ? 'max-h-[500px] opacity-100 translate-y-0'
              : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          <div className="ml-[34px] pl-4 space-y-0.5 border-l border-[rgba(255,255,255,0.25)]">
            {subItems.map((item) => {
              const isSubItemActive = pathname === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => handleSubItemClick(item.route)}
                  className={`w-full text-left px-3 py-1 text-[13px] rounded-lg transition-all duration-200 cursor-pointer ${
                    isSubItemActive
                      ? 'bg-[rgba(255,255,255,0.12)] text-white font-medium'
                      : 'text-[#B4BAC5] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomSidebar({ path, collapsed = false }: PathRouter) {
  const { isOpen, closeSidebar } = useSidebarContext();
  const { user } = useSession();
  const { canManageUsers } = usePermissions();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(() => Date.now());

  useEffect(() => {
    setImageError(false);
    setImageTimestamp(Date.now());
  }, [user?.fotoPerfil]);

  useEffect(() => {
    const handleFotoUpdate = () => {
      setImageError(false);
      setImageTimestamp(Date.now());
    };

    window.addEventListener('userFotoUpdated', handleFotoUpdate);
    return () => {
      window.removeEventListener('userFotoUpdated', handleFotoUpdate);
    };
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('user_groups');

    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };

  const handleProfileClick = () => {
    router.push('/perfil');
    handleItemClick();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Sidebar Desktop - sempre visível */}
      <div
        className={`hidden md:block md:relative transition-all duration-300 ${collapsed ? 'md:w-[100px]' : 'md:w-[280px]'}`}
        data-test="sidebar-container-desktop"
      >
        <SidebarProvider
          data-test="sidebar-provider"
          className={`m-0 p-0 h-full transition-all duration-300 ${collapsed ? 'w-[100px]' : 'w-[280px]'}`}
        >
          <Sidebar
            data-test="sidebar-main"
            className={`h-full transition-all duration-300 ${collapsed ? 'w-[100px]' : 'w-[280px]'}`}
          >
            <SidebarContent
              className={`bg-[#0f1419] h-auto relative overflow-y-auto transition-all duration-300 flex flex-col ${collapsed ? 'w-[100px]' : 'w-[280px]'}`}
              data-test="sidebar-content"
            >
              {/* Seção de Perfil no Topo */}
              <div
                className={`mt-8 mb-6 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}
              >
                <button
                  onClick={handleProfileClick}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300 cursor-pointer ${collapsed ? 'justify-center' : ''}`}
                >
                  {user?.fotoPerfil && !imageError ? (
                    <img
                      src={`${user.fotoPerfil}?t=${imageTimestamp}`}
                      alt="Foto de perfil"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                  )}

                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className="text-white text-sm font-medium truncate"
                        title={user?.name}
                      >
                        {user?.name}
                      </p>
                      <p
                        className="text-[#B4BAC5] text-xs truncate"
                        title={user?.email}
                      >
                        {user?.email}
                      </p>
                    </div>
                  )}
                </button>
                <hr
                  className={`border-[#2d3748] mt-4 transition-all duration-300`}
                  data-test="sidebar-divider"
                />
              </div>

              <SidebarMenu className="flex-1" data-test="sidebar-menu">
                <SidebarMenuItem
                  className="text-[#B4BAC5] items-center gap-1.5 flex flex-col"
                  data-test="sidebar-menu-item"
                >
                  <SidebarButtonMenu
                    src="/itens.svg"
                    srcHover="/itens-hover.svg"
                    name="Itens"
                    route="/itens"
                    data-test="sidebar-btn-itens"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarButtonWithSubmenu
                    src="/relatorios.svg"
                    srcHover="/relatorios-hover.svg"
                    name="Relatórios"
                    data-test="sidebar-btn-relatorios"
                    subItems={[
                      { name: 'Itens', route: '/relatorios/itens' },
                      {
                        name: 'Movimentações',
                        route: '/relatorios/movimentacoes',
                      },
                      { name: 'Orçamentos', route: '/relatorios/orcamentos' },
                    ]}
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarButtonMenu
                    src="/orcamentos.svg"
                    srcHover="/orcamentos-hover.svg"
                    name="Orçamentos"
                    route="/orcamentos"
                    data-test="sidebar-btn-orcamentos"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarButtonMenu
                    src="/fornecedores.svg"
                    srcHover="/fornecedores-hover.svg"
                    name="Fornecedores"
                    route="/fornecedores"
                    data-test="sidebar-btn-fornecedores"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  {canManageUsers() && (
                    <SidebarButtonMenu
                      src="/usuarios-menu.svg"
                      srcHover="/usuarios-menu-hover.svg"
                      name="Usuários"
                      route="/usuarios"
                      data-test="sidebar-btn-usuarios"
                      path={path}
                      onItemClick={handleItemClick}
                      collapsed={collapsed}
                    />
                  )}
                </SidebarMenuItem>
              </SidebarMenu>

              {/* Botão de Sair ao Final */}
              <div
                className={`mt-auto mb-6 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}
              >
                <hr
                  className={`border-[#2d3748] mb-4 transition-all duration-300`}
                  data-test="sidebar-divider-bottom"
                />

                <SidebarMenuButton
                  className={`cursor-pointer relative transition-all duration-300 ease-in-out hover:bg-[rgba(255,255,255,0.08)]! hover:text-inherit! ${collapsed ? 'flex justify-center items-center h-11 w-full rounded-lg' : 'text-[15px] pl-4 h-10 w-full flex gap-2 items-center'} `}
                  onClick={() => {
                    handleLogout();
                    handleItemClick();
                  }}
                  data-test="sidebar-btn-sair"
                  title={collapsed ? 'Sair' : undefined}
                >
                  <img src="/sair.svg" alt="" className="w-[18px] h-[18px]" />
                  {!collapsed && (
                    <span className="text-[14px] font-medium text-[#B4BAC5]">
                      Sair
                    </span>
                  )}
                </SidebarMenuButton>
              </div>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </div>

      {/* Sidebar Mobile */}
      <div
        className={`md:hidden fixed inset-0 z-110 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-test="sidebar-container-mobile"
      >
        <div className="bg-[#0f1419] h-full w-full overflow-y-auto flex flex-col">
          {/* Header com botão fechar */}
          <div className="relative p-5 pt-8 flex items-center justify-end">
            <button
              onClick={closeSidebar}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-all duration-200"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </button>
          </div>

          {/* Seção de Perfil no Topo Mobile */}
          <div className="px-5 mb-6">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300 cursor-pointer"
            >
              {user?.fotoPerfil && !imageError ? (
                <img
                  src={`${user.fotoPerfil}?t=${imageTimestamp}`}
                  alt="Foto de perfil"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
              )}

              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-white text-sm font-medium truncate"
                  title={user?.name}
                >
                  {user?.name}
                </p>
                <p
                  className="text-[#B4BAC5] text-xs truncate"
                  title={user?.email}
                >
                  {user?.email}
                </p>
              </div>
            </button>
            <hr className="mt-4 border-[#2d3748]" />
          </div>

          {/* Conteúdo do menu */}
          <div className="px-5 flex flex-col flex-1">
            <div className="flex flex-col gap-1.5 flex-1 mb-6">
              <MobileMenuItem
                icon="/itens.svg"
                iconHover="/itens-hover.svg"
                name="Itens"
                route="/itens"
                isActive={path?.startsWith('/itens')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              <MobileMenuItem
                icon="/relatorios.svg"
                iconHover="/relatorios-hover.svg"
                name="Relatórios"
                route="/relatorios"
                isActive={path?.startsWith('/relatorios')}
                onClick={() => {
                  handleItemClick();
                }}
                subItems={[
                  { name: 'Itens', route: '/relatorios/itens' },
                  { name: 'Movimentações', route: '/relatorios/movimentacoes' },
                  { name: 'Orçamentos', route: '/relatorios/orcamentos' },
                ]}
              />
              <MobileMenuItem
                icon="/orcamentos.svg"
                iconHover="/orcamentos-hover.svg"
                name="Orçamentos"
                route="/orcamentos"
                isActive={path?.startsWith('/orcamentos')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              <MobileMenuItem
                icon="/fornecedores.svg"
                iconHover="/fornecedores-hover.svg"
                name="Fornecedores"
                route="/fornecedores"
                isActive={path?.startsWith('/fornecedores')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              {canManageUsers() && (
                <MobileMenuItem
                  icon="/usuarios-menu.svg"
                  iconHover="/usuarios-menu-hover.svg"
                  name="Usuários"
                  route="/usuarios"
                  isActive={path?.startsWith('/usuarios')}
                  onClick={() => {
                    handleItemClick();
                  }}
                />
              )}
            </div>

            {/* Botão de Sair Mobile */}
            <div className="mt-auto mb-6">
              <hr className="mb-4 border-[#2d3748]" />

              <button
                onClick={() => {
                  handleLogout();
                  handleItemClick();
                }}
                className="text-[14px] pl-4 h-10 w-full cursor-pointer flex gap-2 items-center rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300"
                data-test="sidebar-btn-sair-mobile"
              >
                <img src="/sair.svg" alt="" className="w-[18px] h-[18px]" />
                <span className="text-[14px] font-medium text-[#B4BAC5]">
                  Sair
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
