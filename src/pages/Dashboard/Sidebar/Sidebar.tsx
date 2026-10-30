import React, { useMemo, useState } from "react";
import { activeMenus } from "./menuData";
import SidebarMenu from "./SidebarMenu";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "../../../hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";

const Sidebar: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { hasPermission, isStaff } = useAuth();

  const menus = useMemo(() => {
    if (!isStaff) return activeMenus;
    return activeMenus
      .map((menu) => {
        if (menu.submenus?.length) {
          const filtered = menu.submenus.filter(
            (s) => !s.permission || hasPermission(s.permission[0], s.permission[1])
          );
          if (!filtered.length) return null;
          return { ...menu, submenus: filtered };
        }
        if (menu.permission && !hasPermission(menu.permission[0], menu.permission[1])) {
          return null;
        }
        return menu;
      })
      .filter(Boolean) as typeof activeMenus;
  }, [hasPermission, isStaff]);

  const isMobile = useIsMobile();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  const getActiveIndex = () =>
    menus.findIndex((menu) => {
      if (menu.to && location.pathname === menu.to) return true;
      if (menu.submenus) {
        return menu.submenus.some((submenu) =>
          location.pathname.startsWith(submenu.to)
        );
      }
      return false;
    });

  const activeIndex = getActiveIndex();

  return (
    <>
      {/* ── Mobile hamburger — sits inside the fixed topbar row ── */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          className="fixed top-0 left-0 z-50 flex items-center justify-center w-14 h-16 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* ── Sidebar drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow flex flex-col py-6 px-2 z-40 border-r transition-transform duration-300 w-64
          ${isMobile
            ? isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 mb-8 mt-2">
          <img src="/assets/logo.png" alt="TraccBox Logo" className="h-8" />
        </div>

        {/* Menus */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto hide-scrollbar">
          {menus.map((menu, idx) => (
            <SidebarMenu
              key={menu.label}
              label={menu.label}
              icon={menu.icon}
              to={menu.to}
              submenus={menu.submenus}
              expanded={expandedIndex === idx}
              onToggle={() =>
                setExpandedIndex(expandedIndex === idx ? null : idx)
              }
              isActive={activeIndex === idx}
              comingSoon={menu.comingSoon}
              onNavigate={isMobile ? closeSidebar : undefined}
            />
          ))}
        </nav>
      </aside>

      {/* ── Mobile overlay backdrop ── */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;