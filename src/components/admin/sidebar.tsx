"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  Users,
  MapPin,
  MessageSquare,
  PanelLeftClose,
  LogOut,
  Mountain,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const nav = [
  { href: "/", label: "Home", icon: House },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/senderos", label: "Senderos", icon: MapPin },
  { href: "/comentarios", label: "Comentarios", icon: MessageSquare },
];

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      // Redirigir de todas formas
      router.push("/login");
      router.refresh();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
      <div className="border-t border-[#EBEBEB] p-2">
        {loading ? (
          <div className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 animate-pulse" />
            {!collapsed && (
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-2.5 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 ${collapsed ? "justify-center" : ""}`}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#3FA9F5] text-xs font-medium text-white">
                {getInitials(user.full_name)}
              </div>
            )}
            {!collapsed && (
              <>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium text-gray-800">
                    {user.full_name}
                  </span>
                  <span className="truncate text-[11px] text-gray-400">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-[#E65C00]"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {collapsed && (
              <button
                onClick={handleLogout}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-[#E65C00]"
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
