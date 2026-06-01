import { useRef, useState, useEffect } from "react";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { getStoredUser, logoutAndRedirect } from "@/lib/auth";
import logo from "@/assets/logo.png";

export function Topbar() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const adminUser = getStoredUser();

  // Close on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => logoutAndRedirect(router.navigate);

  return (
    <div className="relative z-40 mb-4 flex items-center justify-between gap-4 rounded-2xl bg-card px-6 py-4 shadow-sm">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search"
          className="w-full rounded-full border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-gold"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card">
          <Bell className="h-5 w-5" />
          <span className="notification-dot absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* User + logout dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <div className="h-11 w-11 overflow-hidden rounded-full bg-muted">
              <img
                src={logo}
                alt="Admin"
                width={44}
                height={44}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-bold tracking-wide">{adminUser?.full_name ?? "Admin"}</div>
              <div className="text-xs text-muted-foreground">{adminUser?.email ?? ""}</div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] rounded-xl border border-border bg-card py-1.5 shadow-lg">
              <div className="border-b border-border px-4 py-2.5 mb-1">
                <div className="text-sm font-semibold">{adminUser?.full_name ?? "Admin"}</div>
                <div className="text-xs text-muted-foreground">{adminUser?.email ?? ""}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/8 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
