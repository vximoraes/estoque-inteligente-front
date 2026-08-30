'use client';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

type SidebarMenuButtonProps = {
  icon: LucideIcon;
  name: string;
  'data-test'?: string;
  route: string;
  path?: string;
  onItemClick?: () => void;
  collapsed?: boolean;
  className?: string;
};

export default function SidebarButtonMenu({
  icon: Icon,
  name,
  'data-test': dataTest,
  route,
  path,
  onItemClick,
  collapsed = false,
  className = '',
}: SidebarMenuButtonProps) {
  const router = useRouter();
  const isActive = !!path && (path === route || path.startsWith(route + '/'));

  function navigate() {
    router.push(route);
    onItemClick?.();
  }

  if (collapsed) {
    return (
      <SidebarMenuButton
        onClick={navigate}
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
          data-test={`${dataTest}-icon`}
        />
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton
      onClick={navigate}
      className={`w-[250px] h-10 pl-4 pr-3 flex gap-3 items-center cursor-pointer rounded-md border transition-colors duration-150 ${
        isActive
          ? 'bg-ei-sidebar-surface! border-ei-sidebar-divider'
          : 'border-transparent hover:bg-ei-sidebar-surface-hover!'
      } ${className}`}
      data-test={dataTest || 'sidebar-menu-button'}
    >
      <Icon
        className={`w-[18px] h-[18px] shrink-0 ${
          isActive ? 'text-ei-sidebar-text-strong' : 'text-ei-sidebar-text'
        }`}
        data-test={`${dataTest}-icon`}
      />
      <span
        className={`text-[13px] tracking-wide ${
          isActive
            ? 'text-ei-sidebar-text-strong font-semibold'
            : 'text-ei-sidebar-text font-medium'
        }`}
        data-test={`${dataTest}-text`}
      >
        {name}
      </span>
    </SidebarMenuButton>
  );
}
