'use client';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, type LucideIcon } from 'lucide-react';

type SubMenuItem = {
  name: string;
  route: string;
};

type SidebarMenuButtonWithSubmenuProps = {
  icon: LucideIcon;
  name: string;
  'data-test'?: string;
  subItems: SubMenuItem[];
  path?: string;
  onItemClick?: () => void;
  collapsed?: boolean;
};

export default function SidebarButtonWithSubmenu({
  icon: Icon,
  name,
  'data-test': dataTest,
  subItems,
  path,
  onItemClick,
  collapsed = false,
}: SidebarMenuButtonWithSubmenuProps) {
  const router = useRouter();
  const isActive =
    !!path &&
    subItems.some((i) => path === i.route || path.startsWith(i.route + '/'));
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  function handleToggle() {
    setIsOpen((v) => !v);
  }

  function handleSubItemClick(route: string) {
    router.push(route);
    onItemClick?.();
  }

  if (collapsed) {
    return (
      <div className="w-full flex flex-col items-center">
        <SidebarMenuButton
          onClick={handleToggle}
          className={`flex justify-center items-center h-10 w-10 mx-auto cursor-pointer rounded-md border transition-colors duration-150 ${
            isActive
              ? 'bg-ei-sidebar-surface! border-ei-sidebar-divider'
              : 'border-transparent hover:bg-ei-sidebar-surface-hover!'
          }`}
          data-test={dataTest || 'sidebar-menu-button'}
          title={name}
        >
          <Icon
            className={`w-[18px] h-[18px] ${
              isActive
                ? 'text-ei-sidebar-text-strong'
                : 'text-ei-sidebar-text-soft'
            }`}
          />
        </SidebarMenuButton>

        <div
          className={`grid transition-all duration-200 w-full ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-1 pb-1 flex flex-col items-center gap-0.5">
              {subItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => handleSubItemClick(item.route)}
                  className={`w-11 h-11 flex items-center justify-center text-[11px] font-semibold tracking-widest uppercase rounded-md border transition-colors duration-150 cursor-pointer ${
                    path === item.route
                      ? 'bg-ei-sidebar-surface text-ei-sidebar-text border-ei-sidebar-divider'
                      : 'border-transparent text-ei-sidebar-text-soft hover:bg-ei-sidebar-surface-hover hover:text-ei-sidebar-text'
                  }`}
                  data-test={`${dataTest}-subitem-${item.name.toLowerCase()}`}
                  title={item.name}
                >
                  {item.name.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[250px]">
      <SidebarMenuButton
        onClick={handleToggle}
        className={`w-[250px] h-10 pl-4 pr-3 flex gap-3 items-center cursor-pointer rounded-md border transition-colors duration-150 ${
          isActive
            ? 'bg-ei-sidebar-surface! border-ei-sidebar-divider'
            : 'border-transparent hover:bg-ei-sidebar-surface-hover!'
        }`}
        data-test={dataTest || 'sidebar-menu-button'}
      >
        <Icon
          className={`w-[18px] h-[18px] shrink-0 ${
            isActive ? 'text-ei-sidebar-text-strong' : 'text-ei-sidebar-text'
          }`}
        />
        <span
          className={`text-[13px] tracking-wide flex-1 ${
            isActive
              ? 'text-ei-sidebar-text-strong font-semibold'
              : 'text-ei-sidebar-text font-medium'
          }`}
        >
          {name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 mr-1 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          } ${
            isActive || isOpen
              ? 'text-ei-sidebar-chevron opacity-95'
              : 'text-ei-sidebar-text opacity-80'
          }`}
        />
      </SidebarMenuButton>

      <div
        className={`grid transition-all duration-200 ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-0.5 pb-1 flex flex-col gap-0.5">
            {subItems.map((item) => (
              <button
                key={item.route}
                onClick={() => handleSubItemClick(item.route)}
                className={`w-[250px] h-10 pl-4 pr-3 flex items-center gap-3 text-left rounded-md border transition-colors duration-150 cursor-pointer ${
                  path === item.route
                    ? 'bg-ei-sidebar-surface text-ei-sidebar-text font-medium border-ei-sidebar-divider'
                    : 'border-transparent text-ei-sidebar-text hover:bg-ei-sidebar-surface-hover hover:text-ei-sidebar-text-strong'
                }`}
                data-test={`${dataTest}-subitem-${item.name.toLowerCase()}`}
              >
                <span
                  className="w-[18px] h-[18px] shrink-0"
                  aria-hidden="true"
                />
                <span className="text-[13px] tracking-wide">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
