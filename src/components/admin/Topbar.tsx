import { useRef, useState, useEffect, useCallback } from "react";
import { Bell, Search, LogOut, ChevronDown, Star, CreditCard, Film } from "lucide-react";
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

export function Topbar() {
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
    <div className="relative z-40 mb-4 flex items-center justify-between gap-4 rounded-2xl bg-card px-6 py-4 shadow-sm">
      {/* Search */}
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
        <div className="relative" ref={bellRef}>
          <button
            onClick={openBell}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                {notifications.some((n) => !n.is_read) && (
                  <span className="text-xs text-muted-foreground">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                    <Bell className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                        n.is_read ? "opacity-60" : "bg-gold/5"
                      }`}
                    >
                      {notifIcon(n.title)}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground leading-tight">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-snug break-words">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          {timeAgo(n.created_at)}
                        </p>
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
