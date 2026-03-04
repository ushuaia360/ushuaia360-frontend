"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  MessageSquare,
  PanelLeftClose,
  LogOut,
  Mountain,
} from "lucide-react";

const nav = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/senderos", label: "Senderos", icon: MapPin },
  { href: "/comentarios", label: "Comentarios", icon: MessageSquare },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (!collapsed) return;
    hoverTimer.current = setTimeout(() => setCollapsed(false), 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (collapsed) setCollapsed(false);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      className={`relative flex h-screen flex-shrink-0 flex-col border-r border-[#EBEBEB] bg-white transition-all duration-200 ${
        collapsed ? "cursor-pointer" : ""
      }`}
      style={{ width: collapsed ? 64 : 272 }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-[#EBEBEB] px-4">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#3FA9F5]">
          <Mountain className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        {!collapsed && (
          <>
            <span className="ml-2.5 flex-1 whitespace-nowrap text-sm font-semibold tracking-tight text-gray-900">
              Ushuaia360
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "font-medium text-[#3FA9F5]"
                  : "font-light text-gray-500 hover:text-gray-800"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 rounded-md bg-[#EBF5FE]"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                className={`relative z-10 h-4 w-4 flex-shrink-0 ${
                  active ? "text-[#3FA9F5]" : "text-gray-400"
                }`}
                strokeWidth={active ? 2 : 1.75}
              />
              {!collapsed && (
                <span className="relative z-10">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {!collapsed && (
        <div className="border-t border-[#EBEBEB] p-2">
          <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#3FA9F5] text-xs font-medium text-white">
              A
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium text-gray-800">
                Administrador
              </span>
              <span className="truncate text-[11px] text-gray-400">
                admin@ushuaia360.com
              </span>
            </div>
            <button className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-[#E65C00]">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
