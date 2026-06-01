import { useState } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { LayoutGrid, Package, Users, Radio, ChevronLeft, Film, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { logoutAndRedirect } from "@/lib/auth";

const navGroups = [
  {
    label: "MAIN",
    items: [{ to: "/", label: "Dashboard", icon: LayoutGrid }],
  },
  {
    label: "CONTENT",
    items: [
      { to: "/upload-movie", label: "Upload Movie", icon: Package },
      { to: "/movies", label: "Movies", icon: Film },
    ],
  },
  {
    label: "COMMUNICATE",
    items: [
      { to: "/subscribers", label: "Subscribers", icon: Users },
      { to: "/broadcast", label: "Broadcast", icon: Radio },
    ],
  },
] as const;

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  const handleLogout = () => logoutAndRedirect(router.navigate);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  return (
    <aside
      className={`sidebar fixed left-0 top-0 z-30 flex h-screen flex-col bg-sidebar border-r border-white/10 text-sidebar-foreground transition-all duration-300 ease-out ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo Area */}
      <div className="relative flex h-20 shrink-0 items-center justify-center border-b border-white/10">
        <img
          src={logo}
          alt="Cinehubs"
          className={`transition-all duration-300 ${
            collapsed ? "h-9 w-9" : "h-11 w-11"
          }`}
        />

        {/* Collapse Button */}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-1/2 grid h-7 w-7 place-items-center rounded-full border border-gold/30 bg-sidebar hover:bg-sidebar-active text-gold transition-all hover:scale-105 active:scale-95"
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8 min-h-0">
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group Label */}
            {!collapsed && (
              <div className="px-4 pb-2 text-xs font-semibold tracking-[0.5px] text-sidebar-foreground/40 uppercase">
                {group.label}
              </div>
            )}

            {collapsed && <div className="h-px bg-white/10 mx-2 my-4" />}

            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon }) => {
                const isActive = pathname === to;

                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-gold/10 to-transparent text-gold"
                        : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                    title={collapsed ? label : undefined}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gold" />
                    )}

                    {/* Icon */}
                    <Icon
                      className={`h-5 w-5 transition-all ${
                        isActive ? "scale-110" : "group-hover:scale-105"
                      }`}
                    />

                    {/* Label */}
                    <span
                      className={`sidebar-label whitespace-nowrap transition-all duration-300 ${
                        collapsed
                          ? "w-0 opacity-0 overflow-hidden"
                          : "w-auto opacity-100"
                      }`}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group text-sidebar-foreground/60 hover:bg-white/5 hover:text-destructive ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          <span
            className={`sidebar-label whitespace-nowrap transition-all duration-300 ${
              collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            }`}
          >
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
}