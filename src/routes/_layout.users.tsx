import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, X, Phone, Mail, ShoppingCart, CheckCircle, XCircle, Shield } from "lucide-react";
import { API_BASE, getAccessToken } from "@/lib/auth";
import { createPortal } from "react-dom";

export const Route = createFileRoute("/_layout/users")({
  component: UsersPage,
});

interface UserSubscription {
  plan: "BASIC" | "PREMIUM";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  is_active: boolean;
  end_date: string;
}

interface AdminUser {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone_number: string;
  profile_picture: string;
  is_email_verified: boolean;
  is_active: boolean;
  date_joined: string;
  subscription: UserSubscription | null;
  movies_bought: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 20;

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/users/admin/users/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setCount(data.count ?? 0);
        setUsers(Array.isArray(data.results) ? data.results : []);
        setPage(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.phone_number.includes(q)
    );
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10">
            <Users className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">All Users</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${count} registered users`}
            </p>
          </div>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name, email, phone…"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold sm:w-72"
        />
      </div>

      {/* Stat pills */}
      <div className="mt-4 flex flex-wrap gap-3">
        <StatPill label="Total Users" value={count} color="bg-sky-500" />
        <StatPill
          label="Subscribed"
          value={users.filter((u) => u.subscription?.is_active).length}
          color="bg-gold"
        />
        <StatPill
          label="Movies Bought"
          value={users.reduce((s, u) => s + u.movies_bought, 0)}
          color="bg-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-card shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {search ? "No users match your search." : "No users registered yet."}
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr] gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div>User</div>
              <div>Phone</div>
              <div>Subscription</div>
              <div>Bought</div>
              <div>Joined</div>
            </div>

            {/* Desktop rows */}
            <div className="hidden sm:block">
              {paginated.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className="grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-6 py-3.5 last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  {/* Avatar + name/email */}
                  <div className="flex items-center gap-3 min-w-0">
                    {u.profile_picture ? (
                      <img src={u.profile_picture} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold uppercase">
                        {u.full_name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{u.full_name}</span>
                        {u.is_email_verified && (
                          <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="text-sm text-muted-foreground truncate">
                    {u.phone_number || <span className="text-muted-foreground/40">—</span>}
                  </div>

                  {/* Subscription */}
                  <div>
                    {u.subscription ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        u.subscription.is_active
                          ? u.subscription.plan === "PREMIUM"
                            ? "bg-sky-500/10 text-sky-600"
                            : "bg-gold/10 text-gold"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.subscription.is_active ? (u.subscription.plan === "PREMIUM" ? "bg-sky-500" : "bg-gold") : "bg-muted-foreground"}`} />
                        {u.subscription.plan}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">None</span>
                    )}
                  </div>

                  {/* Movies bought */}
                  <div className="flex items-center gap-1.5 text-sm">
                    <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{u.movies_bought}</span>
                  </div>

                  {/* Joined */}
                  <div className="text-sm text-muted-foreground">{formatDate(u.date_joined)}</div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2 p-3">
              {paginated.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className="rounded-xl border border-border p-3 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    {u.profile_picture ? (
                      <img src={u.profile_picture} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold uppercase">
                        {u.full_name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">{u.full_name}</span>
                        {u.is_email_verified && <CheckCircle className="h-3 w-3 shrink-0 text-green-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    {u.subscription?.is_active && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        u.subscription.plan === "PREMIUM" ? "bg-sky-500/10 text-sky-600" : "bg-gold/10 text-gold"
                      }`}>
                        {u.subscription.plan}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</span>
                      <span className="block font-medium mt-0.5 truncate">{u.phone_number || "—"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Bought</span>
                      <span className="block font-medium mt-0.5">{u.movies_bought} movies</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Joined</span>
                      <span className="block font-medium mt-0.5">{formatDate(u.date_joined)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border">
            <button
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium disabled:opacity-40 transition-colors hover:bg-muted"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <button
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium disabled:opacity-40 transition-colors hover:bg-muted"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
            <span className="ml-auto text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {selected && <UserDetailModal user={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl overflow-hidden"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold">User Profile</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 8rem)" }}>
          {/* Avatar + name block */}
          <div className="flex items-center gap-4 px-5 py-5 border-b border-border">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt="" className="h-16 w-16 rounded-full object-cover shrink-0" />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-muted text-lg font-bold uppercase">
                {user.full_name.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{user.full_name}</span>
                {user.is_email_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-600">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
              <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                user.is_active ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600"
              }`}>
                {user.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {user.is_active ? "Active account" : "Inactive account"}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="px-5 py-4 space-y-3">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            <DetailRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={user.phone_number || "Not provided"}
              muted={!user.phone_number}
            />
            <DetailRow
              icon={<Shield className="h-4 w-4" />}
              label="Email verified"
              value={user.is_email_verified ? "Yes" : "No"}
              muted={!user.is_email_verified}
            />
            <DetailRow
              icon={<Users className="h-4 w-4" />}
              label="Joined"
              value={formatDate(user.date_joined)}
            />
            <DetailRow
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Movies bought"
              value={`${user.movies_bought} movie${user.movies_bought !== 1 ? "s" : ""}`}
            />
          </div>

          {/* Subscription block */}
          <div className="mx-5 mb-5 rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Subscription</p>
            {user.subscription ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    user.subscription.plan === "PREMIUM"
                      ? "bg-sky-500/10 text-sky-600"
                      : "bg-gold/10 text-gold"
                  }`}>
                    {user.subscription.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    user.subscription.is_active
                      ? "bg-green-500/10 text-green-600"
                      : "bg-rose-500/10 text-rose-600"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.subscription.is_active ? "bg-green-500" : "bg-rose-500"}`} />
                    {user.subscription.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expires</span>
                  <span className="text-sm text-muted-foreground">{formatDate(user.subscription.end_date)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active subscription</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DetailRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm font-medium w-32 shrink-0">{label}</span>
      <span className={`text-sm truncate ${muted ? "text-muted-foreground/60" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
