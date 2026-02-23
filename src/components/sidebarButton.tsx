'use client';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type sidebarMenuButton = {
  src: string;
  srcHover: string;
  name: string;
  'data-test'?: string;
  route: string;
  path?: string;
  onItemClick?: () => void;
  collapsed?: boolean;
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
}: sidebarMenuButton) {
  const isActivePath = path?.startsWith(
    '/' +
      name
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
  );
  const [isHover, setIsHover] = useState<string>(isActivePath ? srcHover : src);
  const [isRouter, setIsRouter] = useState<string>(
    isActivePath ? 'bg-white' : '',
  );
  const [isBlack, setIsBlack] = useState<string>(
    isActivePath ? 'text-[#000]' : '',
  );
  const [isActive, setIsActive] = useState<boolean>(isActivePath || false);
  const router = useRouter();

  useEffect(() => {
    const isActive = path?.startsWith(
      '/' +
        name
          ?.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
    );

    if (isActive) {
      setIsHover(srcHover);
      setIsRouter('bg-white');
      setIsBlack('text-[#000]');
      setIsActive(true);
    } else {
      setIsRouter('');
      setIsHover(src);
      setIsBlack('');
      setIsActive(false);
    }
  }, [path, src, srcHover, name]);
  function trocarPagina() {
    router.push(route);
    if (onItemClick) {
      onItemClick();
    }
  }
  function hoverButton(svg: string) {
    if (!isRouter) {
      setIsHover(svg);
    }
  }

  if (collapsed) {
    return (
      <>
        <SidebarMenuButton
          className={
            'flex justify-center items-center h-[50px] w-20 cursor-pointer relative transition-all duration-300 ease-in-out group rounded-lg ' +
            (isRouter
              ? isRouter + ' hover:bg-[rgba(255,255,255,1)]! shadow-md '
              : 'hover:bg-[rgba(255,255,255,0.08)]! hover:text-inherit!')
          }
          onClick={() => trocarPagina()}
          data-test={dataTest || 'sidebar-menu-button'}
          title={name}
        >
          <img
            src={isHover}
            alt={name}
            data-test={`${dataTest}-icon` || 'sidebar-button-icon'}
            className="w-6 h-6"
          />
        </SidebarMenuButton>
      </>
    );
  }

  return (
    <>
      <SidebarMenuButton
        className={
          'text-[17px] pl-5 h-[50px] w-[250px] itens cursor-pointer flex gap-3 items-center relative transition-all duration-300 ease-in-out group ' +
          (isRouter
            ? isRouter + ' hover:bg-[rgba(255,255,255,1)]! shadow-md '
            : 'hover:bg-[rgba(255,255,255,0.08)]! hover:text-inherit!')
        }
        onClick={() => trocarPagina()}
        data-test={dataTest || 'sidebar-menu-button'}
      >
        <img
          src={isHover}
          alt=""
          data-test={`${dataTest}-icon` || 'sidebar-button-icon'}
          className="w-[22px] h-[22px]"
        />
        <span
          className={
            'text-[16px] font-medium ' + (isBlack ? isBlack : 'text-[#B4BAC5]')
          }
          data-test={`${dataTest}-text` || 'sidebar-button-text'}
        >
          {name}
        </span>
      </SidebarMenuButton>
    </>
  );
}
