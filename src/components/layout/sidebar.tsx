'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import SidebarButtonMenu from './sidebar-button';
import SidebarButtonWithSubmenu from './sidebar-button-with-submenu';
import { authClient } from '@/lib/auth-client';
import { useSidebarContext } from '@/contexts/SidebarContext';
import {
  X,
  User,
  Package,
  Boxes,
  BarChart3,
  Handshake,
  Truck,
  Tag,
  MapPin,
  Users,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { usePermissions } from '@/hooks/use-permissions';

interface CustomSidebarProps {
  children?: React.ReactNode;
}

const temaOpcoes = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
] as const;

interface PathRouter {
  path: string;
}

function SidebarSectionLabel({
  label,
  collapsed,
  first = false,
}: {
  label: string;
  collapsed?: boolean;
  first?: boolean;
}) {
  if (collapsed) {
    return (
      <div
        className={`w-8 border-b border-ei-sidebar-divider ${first ? 'mt-1 mb-2' : 'my-2'}`}
      />
    );
  }

  return (
    <p
      className={`w-full px-4 text-[11px] font-semibold tracking-wider text-ei-sidebar-text-soft/70 uppercase ${first ? 'mt-0 mb-1' : 'mt-3 mb-1'}`}
    >
      {label}
    </p>
  );
}

interface MobileMenuItemProps {
  icon: LucideIcon;
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
  icon: Icon,
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
        className={`text-[13px] pl-4 pr-3 h-10 w-full cursor-pointer flex gap-3 items-center rounded-md transition-colors duration-150 ${
          isActive
            ? 'bg-ei-sidebar-surface text-ei-sidebar-text-strong'
            : 'text-ei-sidebar-text-soft hover:bg-ei-sidebar-surface-hover hover:text-ei-sidebar-text'
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span
          className={`text-[13px] tracking-wide flex-1 text-left ${isActive ? 'font-semibold' : 'font-medium'}`}
        >
          {name}
        </span>
        {subItems && subItems.length > 0 && (
          <svg
            className={`w-3.5 h-3.5 mr-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'} ${
              isActive || isOpen ? 'opacity-95' : 'opacity-80'
            } ${
              isActive || isOpen
                ? 'text-ei-sidebar-chevron'
                : 'text-ei-sidebar-text'
            }`}
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
          className={`grid transition-all duration-200 ease-out ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-0.5 pb-1 flex flex-col gap-0.5">
              {subItems.map((item) => {
                const isSubItemActive = pathname === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => handleSubItemClick(item.route)}
                    className={`w-full h-10 pl-4 pr-3 flex items-center gap-3 text-left rounded-md transition-colors duration-150 cursor-pointer ${
                      isSubItemActive
                        ? 'bg-ei-sidebar-surface text-ei-sidebar-text font-medium'
                        : 'text-ei-sidebar-text hover:bg-ei-sidebar-surface-hover hover:text-ei-sidebar-text-strong'
                    }`}
                  >
                    <span
                      className="w-[18px] h-[18px] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-[13px] tracking-wide">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomSidebar({ path }: PathRouter) {
  const { isOpen, closeSidebar, collapsed, toggleCollapsed } =
    useSidebarContext();
  const { user } = useSession();
  const { canManageUsers } = usePermissions();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const temaAtual = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';
  const IconeTemaAtual = temaAtual === 'dark' ? Moon : Sun;
  const temaLabelAtual = temaOpcoes.find(
    (opcao) => opcao.value === temaAtual,
  )?.label;
  const alternarTema = () => setTheme(temaAtual === 'dark' ? 'light' : 'dark');

  const displayName = mounted ? user?.name : undefined;
  const displayEmail = mounted ? user?.email : undefined;

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

    await authClient.signOut({ fetchOptions: { credentials: 'include' } });
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
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden md:flex absolute -right-3 top-[46px] -translate-y-1/2 z-20 w-6 h-6 items-center justify-center rounded-full border border-ei-sidebar-divider bg-ei-sidebar-bg text-ei-sidebar-text-soft hover:text-ei-sidebar-text-strong hover:bg-ei-sidebar-surface-hover cursor-pointer transition-colors duration-150"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          data-test="sidebar-toggle-collapsed"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
        <SidebarProvider
          data-test="sidebar-provider"
          className={`m-0 p-0 h-full transition-all duration-300 ${collapsed ? 'w-[100px]' : 'w-[280px]'}`}
          style={
            {
              '--sidebar-width': collapsed ? '100px' : '280px',
            } as React.CSSProperties
          }
        >
          <Sidebar
            data-test="sidebar-main"
            className={`h-full transition-all duration-300 ${collapsed ? 'w-[100px]' : 'w-[280px]'}`}
          >
            <SidebarContent
              className={`bg-ei-sidebar-bg h-full relative overflow-hidden transition-all duration-300 flex flex-col ${collapsed ? 'w-[100px]' : 'w-[280px]'}`}
              data-test="sidebar-content"
            >
              {/* Seção de Perfil no Topo */}
              <div
                className={`mt-6 mb-4 transition-all duration-300 ${collapsed ? 'px-3' : 'px-4'}`}
              >
                <button
                  onClick={handleProfileClick}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-ei-sidebar-surface-hover transition-colors duration-150 cursor-pointer ${collapsed ? 'w-fit mx-auto justify-center' : 'w-full'}`}
                >
                  {mounted && user?.fotoPerfil && !imageError ? (
                    <img
                      src={`${user.fotoPerfil}?t=${imageTimestamp}`}
                      alt="Foto de perfil"
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-ei-sidebar-avatar-bg flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-ei-sidebar-text-soft" />
                    </div>
                  )}

                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className="text-ei-sidebar-text-strong text-[13px] font-medium tracking-wide truncate"
                        title={displayName}
                      >
                        {displayName}
                      </p>
                      <p
                        className="text-ei-sidebar-text-soft text-[11px] truncate"
                        title={displayEmail}
                      >
                        {displayEmail}
                      </p>
                    </div>
                  )}
                </button>
                <div
                  className={`border-b border-ei-sidebar-divider mt-4 transition-all duration-300`}
                  data-test="sidebar-divider"
                />
              </div>

              <SidebarMenu
                className="flex-1 min-h-0 overflow-y-auto"
                data-test="sidebar-menu"
              >
                <SidebarMenuItem
                  className="items-center gap-2 flex flex-col"
                  data-test="sidebar-menu-item"
                >
                  <SidebarSectionLabel
                    label="Bens"
                    collapsed={collapsed}
                    first
                  />
                  <SidebarButtonMenu
                    icon={Package}
                    name="Patrimônio"
                    route="/bens/patrimonio"
                    data-test="sidebar-btn-patrimonio"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarButtonMenu
                    icon={Boxes}
                    name="Almoxarifado"
                    route="/bens/almoxarifado"
                    data-test="sidebar-btn-almoxarifado"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarSectionLabel
                    label="Operações"
                    collapsed={collapsed}
                  />
                  <SidebarButtonWithSubmenu
                    icon={BarChart3}
                    name="Relatórios"
                    data-test="sidebar-btn-relatorios"
                    subItems={[
                      { name: 'Itens', route: '/relatorios/itens' },
                      {
                        name: 'Patrimônio',
                        route: '/relatorios/patrimonio',
                      },
                      {
                        name: 'Movimentações',
                        route: '/relatorios/movimentacoes',
                      },
                      {
                        name: 'Empréstimos',
                        route: '/relatorios/emprestimos',
                      },
                    ]}
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarButtonMenu
                    icon={Handshake}
                    name="Empréstimos"
                    route="/emprestimos"
                    data-test="sidebar-btn-emprestimos"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarSectionLabel
                    label="Cadastros"
                    collapsed={collapsed}
                  />
                  <SidebarButtonMenu
                    icon={Truck}
                    name="Fornecedores"
                    route="/fornecedores"
                    data-test="sidebar-btn-fornecedores"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarButtonMenu
                    icon={Tag}
                    name="Categorias"
                    route="/categorias"
                    data-test="sidebar-btn-categorias"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  <SidebarButtonMenu
                    icon={MapPin}
                    name="Localizações"
                    route="/localizacoes"
                    data-test="sidebar-btn-localizacoes"
                    path={path}
                    onItemClick={handleItemClick}
                    collapsed={collapsed}
                  />
                  {canManageUsers() && (
                    <>
                      <SidebarSectionLabel
                        label="Administração"
                        collapsed={collapsed}
                      />
                      <SidebarButtonMenu
                        icon={Users}
                        name="Usuários"
                        route="/usuarios"
                        data-test="sidebar-btn-usuarios"
                        path={path}
                        onItemClick={handleItemClick}
                        collapsed={collapsed}
                      />
                    </>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>

              {/* Botão de Sair ao Final */}
              <div
                className={`mt-auto mb-6 transition-all duration-300 ${collapsed ? 'px-3' : 'px-4'}`}
              >
                <div
                  className={`border-b border-ei-sidebar-divider mb-6 transition-all duration-300`}
                  data-test="sidebar-divider-bottom"
                />

                {collapsed ? (
                  <button
                    type="button"
                    onClick={alternarTema}
                    className="flex justify-center items-center h-10 w-10 mx-auto mb-2 rounded-md hover:bg-ei-sidebar-surface-hover cursor-pointer transition-colors duration-150"
                    title="Tema"
                    data-test="sidebar-tema-toggle-collapsed"
                  >
                    <IconeTemaAtual className="w-4 h-4 shrink-0 text-ei-sidebar-text-soft" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={alternarTema}
                    className="flex items-center gap-3 h-10 w-full pl-4 pr-3 mb-2 rounded-md hover:bg-ei-sidebar-surface-hover cursor-pointer transition-colors duration-150"
                    data-test="sidebar-tema-toggle"
                  >
                    <IconeTemaAtual className="w-4 h-4 shrink-0 text-ei-sidebar-text-soft" />
                    <span className="text-[13px] font-medium tracking-wide text-ei-sidebar-text-soft">
                      Tema: {temaLabelAtual}
                    </span>
                  </button>
                )}

                <SidebarMenuButton
                  className={`cursor-pointer transition-colors duration-150 hover:bg-ei-sidebar-surface-hover! ${collapsed ? 'flex justify-center items-center h-10 w-10 mx-auto rounded-md' : 'pl-4 pr-3 h-10 w-full flex gap-3 items-center rounded-md'}`}
                  onClick={() => {
                    handleLogout();
                    handleItemClick();
                  }}
                  data-test="sidebar-btn-sair"
                  title={collapsed ? 'Sair' : undefined}
                >
                  <LogOut className="w-[18px] h-[18px] shrink-0 text-ei-sidebar-text-soft" />
                  {!collapsed && (
                    <span className="text-[13px] font-medium tracking-wide text-ei-sidebar-text-soft">
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
        <div className="bg-ei-sidebar-bg h-full w-full overflow-y-auto flex flex-col">
          {/* Header com botão fechar */}
          <div className="relative px-5 pt-6 pb-2 flex items-center justify-end">
            <button
              onClick={closeSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-ei-sidebar-surface-hover transition-colors duration-150"
              aria-label="Fechar menu"
            >
              <X
                className="w-4 h-4 text-ei-sidebar-text-soft"
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* Seção de Perfil no Topo Mobile */}
          <div className="px-5 mb-4">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-ei-sidebar-surface-hover transition-colors duration-150 cursor-pointer"
            >
              {mounted && user?.fotoPerfil && !imageError ? (
                <img
                  src={`${user.fotoPerfil}?t=${imageTimestamp}`}
                  alt="Foto de perfil"
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-ei-sidebar-avatar-bg flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-ei-sidebar-text-soft" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-ei-sidebar-text-strong text-[13px] font-medium tracking-wide truncate"
                  title={displayName}
                >
                  {displayName}
                </p>
                <p
                  className="text-ei-sidebar-text-soft text-[11px] truncate"
                  title={displayEmail}
                >
                  {displayEmail}
                </p>
              </div>
            </button>
            <div className="border-b border-ei-sidebar-divider mt-4" />
          </div>

          {/* Conteúdo do menu */}
          <div className="px-5 flex flex-col flex-1">
            <div className="flex flex-col gap-2 flex-1 mb-6">
              <SidebarSectionLabel label="Bens" first />
              <MobileMenuItem
                icon={Package}
                name="Patrimônio"
                route="/bens/patrimonio"
                isActive={path?.startsWith('/bens/patrimonio')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              <MobileMenuItem
                icon={Boxes}
                name="Almoxarifado"
                route="/bens/almoxarifado"
                isActive={path?.startsWith('/bens/almoxarifado')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              <SidebarSectionLabel label="Operações" />
              <MobileMenuItem
                icon={BarChart3}
                name="Relatórios"
                route="/relatorios"
                isActive={path?.startsWith('/relatorios')}
                onClick={() => {
                  handleItemClick();
                }}
                subItems={[
                  { name: 'Itens', route: '/relatorios/itens' },
                  { name: 'Patrimônio', route: '/relatorios/patrimonio' },
                  { name: 'Movimentações', route: '/relatorios/movimentacoes' },
                  { name: 'Empréstimos', route: '/relatorios/emprestimos' },
                ]}
              />
              <MobileMenuItem
                icon={Handshake}
                name="Empréstimos"
                route="/emprestimos"
                isActive={path?.startsWith('/emprestimos')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              <SidebarSectionLabel label="Cadastros" />
              <MobileMenuItem
                icon={Truck}
                name="Fornecedores"
                route="/fornecedores"
                isActive={path?.startsWith('/fornecedores')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              <MobileMenuItem
                icon={Tag}
                name="Categorias"
                route="/categorias"
                isActive={path?.startsWith('/categorias')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              <MobileMenuItem
                icon={MapPin}
                name="Localizações"
                route="/localizacoes"
                isActive={path?.startsWith('/localizacoes')}
                onClick={() => {
                  handleItemClick();
                }}
              />
              {canManageUsers() && (
                <>
                  <SidebarSectionLabel label="Administração" />
                  <MobileMenuItem
                    icon={Users}
                    name="Usuários"
                    route="/usuarios"
                    isActive={path?.startsWith('/usuarios')}
                    onClick={() => {
                      handleItemClick();
                    }}
                  />
                </>
              )}
            </div>

            {/* Botão de Sair Mobile */}
            <div className="mt-auto mb-6">
              <div className="border-b border-ei-sidebar-divider mb-6" />

              <button
                type="button"
                onClick={alternarTema}
                className="flex items-center gap-3 h-10 pl-4 pr-3 mb-2 rounded-md hover:bg-ei-sidebar-surface-hover cursor-pointer transition-colors duration-150 w-full"
                data-test="sidebar-tema-toggle-mobile"
              >
                <IconeTemaAtual className="w-4 h-4 shrink-0 text-ei-sidebar-text-soft" />
                <span className="text-[13px] font-medium tracking-wide text-ei-sidebar-text-soft">
                  Tema: {temaLabelAtual}
                </span>
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  handleItemClick();
                }}
                className="pl-4 pr-3 h-10 w-full cursor-pointer flex gap-3 items-center rounded-md hover:bg-ei-sidebar-surface-hover transition-colors duration-150 text-ei-sidebar-text-soft hover:text-ei-sidebar-text"
                data-test="sidebar-btn-sair-mobile"
              >
                <LogOut className="w-[18px] h-[18px] shrink-0" />
                <span className="text-[13px] font-medium tracking-wide">
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
