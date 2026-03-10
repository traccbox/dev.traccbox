import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { SidebarSubmenu, SidebarMenuConfig } from "./menuData";

interface SidebarMenuProps {
  label: string;
  icon: string;
  to?: string;
  submenus?: SidebarSubmenu[];
  expanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  comingSoon?: boolean;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  label,
  icon,
  to,
  submenus = [],
  expanded,
  onToggle,
  isActive,
  comingSoon = false,
}) => {
  const location = useLocation();
  const LucideIcon = (LucideIcons)[icon] || LucideIcons["Circle"];


  if (!submenus.length && to) {
    const isComingSoon = comingSoon;
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors font-medium text-base";
    const activeClasses = "bg-[#1658E5] text-white shadow";
    const normalClasses = "text-gray-700 hover:bg-gray-100";
    const comingSoonClasses = "text-gray-400 bg-gray-50 cursor-not-allowed opacity-70";

    return (
      <div className="relative">
        <NavLink
          to={isComingSoon ? "#" : to}
          onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
          className={({ isActive: navActive }) =>
            `${baseClasses} ${
              isComingSoon 
                ? comingSoonClasses 
                : navActive || isActive
                  ? activeClasses
                  : normalClasses
            }`
          }
        >
          <LucideIcon className="w-5 h-5" />
          <span className="flex-1">{label}</span>
          {isComingSoon && (
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
              Coming Soon
            </span>
          )}
        </NavLink>
      </div>
    );
  }

  // With submenus, render collapsible
  const isComingSoon = comingSoon;
  const buttonBaseClasses = "flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-base focus:outline-none";
  const buttonActiveClasses = "bg-blue-50 text-[#1658E5]";
  const buttonNormalClasses = "text-gray-700 hover:bg-gray-100";
  const buttonComingSoonClasses = "text-gray-400 bg-gray-50 cursor-not-allowed opacity-70";

  return (
    <div className="mb-2 hide-scrollbar">
      <button
        type="button"
        onClick={isComingSoon ? undefined : onToggle}
        disabled={isComingSoon}
        className={`${buttonBaseClasses} ${
          isComingSoon 
            ? buttonComingSoonClasses 
            : expanded || isActive
              ? buttonActiveClasses
              : buttonNormalClasses
        }`}
      >
        <LucideIcon className="w-5 h-5" />
        <span className="flex-1 text-left text-xs">{label}</span>
        {isComingSoon ? (
          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
            Coming Soon
          </span>
        ) : (
          <LucideIcons.ChevronDown
            className={`w-4 h-4 ml-auto transition-transform ${
              expanded ? "rotate-180" : "rotate-0"
            }`}
          />
        )}
      </button>
      {expanded && !isComingSoon && (
        <div className="pl-10 py-2 bg-white">
          {submenus.map((submenu) => {
            const isSubmenuComingSoon = submenu.comingSoon;
            const submenuBaseClasses = "block py-1.5 text-xs rounded transition-colors mb-1";
            const submenuActiveClasses = "text-[#1658E5] font-semibold bg-blue-50";
            const submenuNormalClasses = "text-gray-700 hover:text-[#1658E5] hover:bg-blue-50";
            const submenuComingSoonClasses = "text-gray-400 cursor-not-allowed opacity-60";

            return (
              <NavLink
                key={submenu.to}
                to={isSubmenuComingSoon ? "#" : submenu.to}
                onClick={isSubmenuComingSoon ? (e) => e.preventDefault() : undefined}
                className={({ isActive: navActive }) =>
                  `${submenuBaseClasses} ${
                    isSubmenuComingSoon
                      ? submenuComingSoonClasses
                      : navActive
                        ? submenuActiveClasses
                        : submenuNormalClasses
                  }`
                }
              >
                <span className="flex items-center justify-between">
                  <span>{submenu.label}</span>
                  {isSubmenuComingSoon && (
                    <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-medium rounded-full">
                      Soon
                    </span>
                  )}
                </span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarMenu;
