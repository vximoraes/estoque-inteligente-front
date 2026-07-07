'use client';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';

type SidebarMenuButtonProps = {
  src: string;
  srcHover: string;
  name: string;
  'data-test'?: string;
  route: string;
  path?: string;
  onItemClick?: () => void;
  collapsed?: boolean;
  className?: string;
};

export default function SidebarButtonMenu({
  src,
  srcHover,
  name,
  'data-test': dataTest,
  route,
  path,
  onItemClick,
  collapsed = false,
  className = '',
}: SidebarMenuButtonProps) {
  const router = useRouter();
  const slug = name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isActive = !!path?.startsWith('/' + slug);

  function navigate() {
    router.push(route);
    onItemClick?.();
  }

  if (collapsed) {
    return (
      <SidebarMenuButton
        onClick={navigate}
        className={`flex justify-center items-center h-10 w-10 mx-auto cursor-pointer rounded-sm transition-colors duration-150 ${
          isActive
            ? 'bg-ei-sidebar-surface!'
            : 'hover:bg-ei-sidebar-surface-hover!'
        }`}
        data-test={dataTest || 'sidebar-menu-button'}
        title={name}
      >
        <img
          src={src}
          alt={name}
          className="w-[18px] h-[18px]"
          data-test={`${dataTest}-icon`}
        />
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton
      onClick={navigate}
      className={`w-[250px] h-10 pl-4 pr-3 flex gap-3 items-center cursor-pointer rounded-sm transition-colors duration-150 ${
        isActive
          ? 'bg-ei-sidebar-surface!'
          : 'hover:bg-ei-sidebar-surface-hover!'
      } ${className}`}
      data-test={dataTest || 'sidebar-menu-button'}
    >
      <img
        src={src}
        alt=""
        className="w-[18px] h-[18px] shrink-0"
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
