import { useState, useEffect } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { LayoutGrid, Package, Users, Radio, ChevronLeft, Film, LogOut, Tags, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { logoutAndRedirect } from "@/lib/auth";

const navGroups = [
  {
    label: "MAIN",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid }],
  },
  {
    label: "CONTENT",
    items: [
      { to: "/upload-movie", label: "Upload Movie", icon: Package },
      { to: "/movies", label: "Movies", icon: Film },
      { to: "/categories", label: "Categories", icon: Tags },
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
  /** Controlled mobile drawer state */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({ onCollapsedChange, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const isMobileOpen = mobileOpen !== undefined ? mobileOpen : internalMobileOpen;

  const setMobileOpen = (open: boolean) => {
    if (onMobileOpenChange) {
      onMobileOpenChange(open);
    } else {
      setInternalMobileOpen(open);
    }
  };

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  const handleLogout = () => logoutAndRedirect(router.navigate);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  // Auto-close mobile drawer on navigation
  useEffect(() => {
    if (isMobileOpen) {
      setMobileOpen(false);
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar fixed left-0 top-0 z-30 h-screen flex flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground shadow-xl transition-all duration-300 ease-out md:shadow-none
          w-72 -translate-x-full ${isMobileOpen ? "translate-x-0" : ""}
          md:w-auto md:translate-x-0
          ${collapsed ? "md:w-[4.5rem]" : "md:w-64 xl:w-72"}
        `}
      >
        {/* Logo + Controls Area */}
        <div className="relative flex h-20 shrink-0 items-center justify-center border-b border-white/10">
          <img
            src={logo}
            alt="Cinehubs"
            className={`transition-all duration-300 ${
              collapsed ? "h-9 w-9" : "h-11 w-11"
            }`}
          />

          {/* Desktop Collapse Button */}
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-1/2 hidden h-7 w-7 place-items-center rounded-full border border-gold/30 bg-sidebar text-gold transition-all hover:scale-105 active:scale-95 md:grid hover:bg-sidebar-active"
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Mobile Close Button (X) */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="absolute right-3 top-1/2 grid h-8 w-8 place-items-center rounded-full text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8 min-h-0">
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Group Label - always visible on mobile, hidden on desktop when collapsed */}
              <div
                className={`px-4 pb-2 text-xs font-semibold tracking-[0.5px] text-sidebar-foreground/40 uppercase ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                {group.label}
              </div>

              {/* Divider shown only in collapsed desktop mode */}
              {collapsed && <div className="mx-2 my-4 hidden h-px bg-white/10 md:block" />}

              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const isActive = pathname === to;

                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-gold/10 to-transparent text-gold"
                          : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground"
                      } ${collapsed ? "md:justify-center md:px-2" : ""}`}
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

                      {/* Label - responsive collapse behavior */}
                      <span
                        className={`sidebar-label whitespace-nowrap transition-all duration-300 ${
                          collapsed
                            ? "md:w-0 md:opacity-0 md:overflow-hidden"
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
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/60 transition-all group hover:bg-white/5 hover:text-destructive ${
              collapsed ? "md:justify-center md:px-2" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            <span
              className={`sidebar-label whitespace-nowrap transition-all duration-300 ${
                collapsed ? "md:w-0 md:opacity-0 md:overflow-hidden" : "w-auto opacity-100"
              }`}
            >
              Log out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}