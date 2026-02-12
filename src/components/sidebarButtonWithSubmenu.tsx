"use client"

import { SidebarMenuButton } from "@/components/ui/sidebar"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

type SubMenuItem = {
  name: string
  route: string
}

type SidebarMenuButtonWithSubmenu = {
  src: string
  srcHover: string
  name: string
  "data-test"?: string
  subItems: SubMenuItem[]
  path?: string
  onItemClick?: () => void
  collapsed?: boolean
}

export default function SidebarButtonWithSubmenu({ 
  src, 
  srcHover, 
  name, 
  "data-test": dataTest, 
  subItems,
  path, 
  onItemClick, 
  collapsed = false 
}: SidebarMenuButtonWithSubmenu) {
  const [isHover, setIsHover] = useState<string>(src)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const isCurrentlyActive = path?.startsWith("/" + normalizedName)
    
    setIsActive(!!isCurrentlyActive)
    setIsHover(isCurrentlyActive ? srcHover : src)
    setIsOpen(!!isCurrentlyActive)
  }, [path, name, src, srcHover])

  function handleToggle() {
    setIsOpen(!isOpen)
  }

  function handleSubItemClick(route: string) {
    router.push(route)
    if (onItemClick) {
      onItemClick()
    }
  }

  if (collapsed) {
    return (
      <div className="w-full flex flex-col items-center">
        <SidebarMenuButton
          className={`flex justify-center items-center h-[50px] w-[80px] cursor-pointer relative transition-all duration-300 ease-in-out rounded-lg ${
            isActive 
              ? "bg-white hover:bg-[rgba(255,255,255,1)]! shadow-md" 
              : "hover:bg-[rgba(255,255,255,0.08)]! hover:text-inherit!"
          }`}
          onClick={handleToggle}
          data-test={dataTest || "sidebar-menu-button"}
          title={name}
        >
          <img src={isHover} alt={name} className="w-[24px] h-[24px]" />
        </SidebarMenuButton>
        
        {/* Submenu colapsado - mostra primeira letra */}
        <div 
          className={`overflow-hidden transition-all duration-300 w-full flex flex-col items-center ${
            isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-0.5 space-y-1 flex flex-col items-center">
            {subItems.map((item) => (
              <button
                key={item.route}
                onClick={() => handleSubItemClick(item.route)}
                className={`w-[50px] h-[50px] flex items-center justify-center text-[16px] font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  path === item.route
                    ? "bg-[rgba(255,255,255,0.12)] text-white"
                    : "text-[#B4BAC5] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                }`}
                data-test={`${dataTest}-subitem-${item.name.toLowerCase()}`}
                title={item.name}
              >
                {item.name.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SidebarMenuButton
        className={`text-[17px] pl-[20px] h-[50px] w-[250px] cursor-pointer flex gap-[12px] items-center relative transition-all duration-300 ease-in-out group ${
          isActive 
            ? "bg-white hover:bg-[rgba(255,255,255,1)]! shadow-md" 
            : "hover:bg-[rgba(255,255,255,0.08)]! hover:text-inherit!"
        }`}
        onClick={handleToggle}
        data-test={dataTest || "sidebar-menu-button"}
      >
        <img src={isHover} alt="" className="w-[22px] h-[22px]" />
        <span className={`text-[16px] font-medium flex-1 ${isActive ? "text-black" : "text-[#B4BAC5]"}`}>
          {name}
        </span>
        <ChevronDown 
          className={`w-4 h-4 mr-3 transition-all duration-300 rotate-0 ${isOpen ? "!rotate-180" : ""} ${
            (isActive || isOpen) ? "opacity-100" : "opacity-0"
          } ${
            isActive ? "text-black" : "text-[#B4BAC5]"
          }`}
        />
      </SidebarMenuButton>

      {/* Sub-menu expandido */}
      {isOpen && (
        <div className="transition-all duration-300 mt-0.5 pr-4">
          <div className="ml-[34px] space-y-1">
            {subItems.map((item) => (
              <button
                key={item.route}
                onClick={() => handleSubItemClick(item.route)}
                className={`w-full text-left px-4 py-2 text-[15px] rounded-lg transition-all duration-200 cursor-pointer ${
                  path === item.route
                    ? "bg-[rgba(255,255,255,0.12)] text-white font-medium"
                    : "text-[#B4BAC5] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                }`}
                data-test={`${dataTest}-subitem-${item.name.toLowerCase()}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
