import { useRef, useState, useEffect, useCallback } from "react";
import { Bell, Search, LogOut, ChevronDown, Star, CreditCard, Film, Menu } from "lucide-react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { getStoredUser, logoutAndRedirect, API_BASE, getAccessToken } from "@/lib/auth";
import logo from "@/assets/logo.png";

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminNotification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function notifIcon(title: string) {
  if (title.toLowerCase().includes("rating"))
    return <Star className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />;
  if (title.toLowerCase().includes("subscription"))
    return <CreditCard className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />;
  return <Film className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />;
}

// ── Component ──────────────────────────────────────────────────────────────

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const adminUser = getStoredUser();

  // Notification state
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
  }, [pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Fetch admin notifications
  const fetchNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/admin/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.results ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // Silently ignore — polling will retry
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Mark all as read when the bell dropdown opens
  const openBell = async () => {
    setBellOpen((o) => !o);
    if (!bellOpen && unreadCount > 0) {
      const token = getAccessToken();
      if (!token) return;
      try {
        await fetch(`${API_BASE}/notifications/admin/read-all/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch {
        // Ignore — unread count will self-correct on next poll
      }
    }
  };

  const handleLogout = () => logoutAndRedirect(router.navigate);

  return (
    <div className="relative z-40 mb-3 rounded-2xl bg-card px-3 py-2.5 shadow-sm sm:mb-4 sm:px-4 sm:py-3 md:px-5 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: menu + search */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card hover:bg-muted transition-colors sm:h-10 sm:w-10"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-xl lg:max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search movies, users, plans..."
              className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gold lg:py-3"
            />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
          {/* Notification bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={openBell}
              className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-muted transition-colors sm:h-10 sm:w-10"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:w-80">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-sm font-semibold">Notifications</span>
                  {notifications.some((n) => !n.is_read) && (
                    <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                  )}
                </div>

                <div className="max-h-[65vh] overflow-y-auto sm:max-h-[360px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                      <Bell className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 border-b border-border/50 px-4 py-3 transition-colors last:border-0 ${
                          n.is_read ? "opacity-60" : "bg-gold/5"
                        }`}
                      >
                        {notifIcon(n.title)}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight text-foreground">{n.title}</p>
                          <p className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User + logout dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-muted sm:gap-3 sm:px-2"
            >
              <div className="h-9 w-9 overflow-hidden rounded-full bg-muted sm:h-10 sm:w-10 lg:h-11 lg:w-11">
                <img
                  src={logo}
                  alt="Admin"
                  width={44}
                  height={44}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden text-right leading-tight lg:block">
                <div className="max-w-[180px] truncate text-sm font-bold tracking-wide">
                  {adminUser?.full_name ?? "Admin"}
                </div>
                <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                  {adminUser?.email ?? ""}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-border bg-card py-1.5 shadow-lg">
                <div className="mb-1 border-b border-border px-4 py-2.5">
                  <div className="truncate text-sm font-semibold">{adminUser?.full_name ?? "Admin"}</div>
                  <div className="truncate text-xs text-muted-foreground">{adminUser?.email ?? ""}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/8"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="mt-2 sm:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>
    </div>
  );
}
