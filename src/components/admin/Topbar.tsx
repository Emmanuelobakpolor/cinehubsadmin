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

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/upload-movie": "Upload",
  "/movies": "Movies",
  "/categories": "Categories",
  "/subscribers": "Subscribers",
  "/broadcast": "Broadcast",
};

// ── Component ──────────────────────────────────────────────────────────────

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pageName = PAGE_NAMES[pathname] ?? "Dashboard";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const adminUser = getStoredUser();

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

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

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

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
    <div className="relative z-20 mb-3 w-full min-w-0 rounded-2xl bg-card px-3 py-2 shadow-sm sm:mb-4 sm:px-4 sm:py-3 md:px-5 lg:px-6 lg:py-4">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">

        {/* Left: hamburger + page name / search */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-muted active:scale-90"
            aria-label="Open menu"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          {/* Page name — mobile only */}
          <span className="md:hidden text-sm font-bold tracking-wide truncate">{pageName}</span>

          {/* Search bar — desktop only */}
          <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-xl lg:max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search movies, users, plans..."
              className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gold lg:py-3"
            />
          </div>
        </div>

        {/* Right: notification + user */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">

          {/* Notification bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={openBell}
              className="relative grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-full border border-border bg-card hover:bg-muted transition-colors"
            >
              <Bell className="h-[17px] w-[17px] sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 sm:right-1 sm:top-1 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel — fixed full-width on mobile, dropdown on desktop */}
            {bellOpen && (
              <div className="
                max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-[4.25rem]
                sm:absolute sm:right-0 sm:top-[calc(100%+8px)] sm:w-[min(24rem,calc(100vw-1rem))]
                z-[9999] overflow-hidden rounded-2xl border border-border bg-card shadow-xl
              ">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto sm:max-h-[340px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                      <Bell className="h-8 w-8 opacity-25" />
                      <p className="text-sm font-medium">You're all caught up</p>
                      <p className="text-xs opacity-60">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`relative flex gap-3 border-b border-border/50 px-4 py-3.5 transition-colors last:border-0 ${
                          n.is_read ? "opacity-50" : "bg-gold/5"
                        }`}
                      >
                        {/* Unread accent bar */}
                        {!n.is_read && (
                          <span className="absolute left-0 inset-y-2 w-0.5 rounded-r-full bg-gold" />
                        )}
                        <div className="mt-0.5 shrink-0">{notifIcon(n.title)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug text-foreground">{n.title}</p>
                          <p className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground">{n.message}</p>
                          <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer — only when there are notifications */}
                {notifications.length > 0 && (
                  <div className="border-t border-border px-4 py-2.5 text-center">
                    <span className="text-[11px] text-muted-foreground/60">
                      {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User + logout dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1 rounded-xl px-1 py-1 transition-colors hover:bg-muted sm:gap-2 sm:px-2 sm:py-1.5"
            >
              <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full bg-muted shrink-0">
                <img
                  src={logo}
                  alt="Admin"
                  width={40}
                  height={40}
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
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-[9999] w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-border bg-card py-1.5 shadow-lg">
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
    </div>
  );
}
