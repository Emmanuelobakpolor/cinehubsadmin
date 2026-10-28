import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Star, Film, TrendingUp, ChevronDown, Gem, Edit, Eye, Activity, UserCheck, CalendarClock } from "lucide-react";
import { useState, useEffect } from "react";
import { SubscriptionPricingModal } from "@/components/admin/SubscriptionPricingModal";
import { API_BASE, getAccessToken } from "@/lib/auth";
import type { Movie } from "@/components/admin/AddMovieModal";

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
});

interface Plan {
  id: number;
  name: string;
  price: string;
  description: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string) {
  const num = parseFloat(price);
  return isNaN(num) ? price : `₦${num.toLocaleString()}`;
}

interface TopMovie {
  id: number;
  title: string;
  thumbnail: string;
  views_count: number;
  unique_viewers: number;
  avg_rating: number | null;
}

function okJson(r: Response) {
  if (!r.ok) throw new Error(`Request failed (${r.status})`);
  return r.json();
}

function formatCount(n: number) {
  return n.toLocaleString();
}

function Dashboard() {
  const [openPlan, setOpenPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userStats, setUserStats] = useState({
    total_users: 0,
    new_users_this_month: 0,
    active_today: 0,
    active_users_7d: 0,
    active_users_30d: 0,
    total_views: 0,
    basic_subs: 0,
    premium_subs: 0,
  });
  const [movieStats, setMovieStats] = useState<{ total_movies: number; top_movies: TopMovie[] }>({
    total_movies: 0,
    top_movies: [],
  });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const statsPending = loadingStats || statsError;
  const [loadingMovies, setLoadingMovies] = useState(true);

  const fetchPlans = () => {
    fetch(`${API_BASE}/subscriptions/plans/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setPlans(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => {});
  };

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getAccessToken()}` };

    Promise.all([
      fetch(`${API_BASE}/users/dashboard-stats/`, { headers }).then(okJson),
      fetch(`${API_BASE}/movies/stats/`, { headers }).then(okJson),
    ])
      .then(([u, m]) => {
        setUserStats((prev) => ({ ...prev, ...u }));
        setMovieStats({ total_movies: m.total_movies ?? 0, top_movies: m.top_movies ?? [] });
      })
      .catch(() => setStatsError(true))
      .finally(() => setLoadingStats(false));

    fetch(`${API_BASE}/movies/?page_size=6`, { headers })
      .then((r) => r.json())
      .then((data) => setMovies(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoadingMovies(false));

    fetchPlans();
  }, []);

  const stats = [
    { label: "Total Users", value: statsPending ? "—" : String(userStats.total_users), icon: Users, color: "bg-gold text-white", link: "/users" },
    { label: "Basic Subs", value: statsPending ? "—" : String(userStats.basic_subs), icon: Star, color: "bg-emerald-500 text-white", link: "/subscribers" },
    { label: "Premium Subs", value: statsPending ? "—" : String(userStats.premium_subs), icon: Star, color: "bg-sky-500 text-white", link: "/subscribers" },
    { label: "Total Movies", value: statsPending ? "—" : String(movieStats.total_movies), icon: Film, color: "bg-amber-300 text-white", withMonth: true, link: "/movies" },
  ];

  const activity = [
    { label: "Movie Views", value: formatCount(userStats.total_views), hint: "All-time plays", icon: Eye, color: "bg-violet-500 text-white" },
    { label: "Active Today", value: formatCount(userStats.active_today), hint: "Last 24 hours", icon: Activity, color: "bg-rose-500 text-white" },
    { label: "Active Users", value: formatCount(userStats.active_users_30d), hint: `${formatCount(userStats.active_users_7d)} this week · last 30 days`, icon: UserCheck, color: "bg-teal-500 text-white" },
    { label: "New Users", value: formatCount(userStats.new_users_this_month), hint: "This month", icon: CalendarClock, color: "bg-indigo-500 text-white" },
  ];

  return (
    <>
      {statsError && (
        <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Couldn't load dashboard stats. Refresh the page, or log in again if this keeps happening.
        </div>
      )}

      {/* Stats Grid — 2 columns from 360px, 4 columns on lg+ */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 overflow-hidden rounded-2xl bg-card p-3.5 shadow-sm transition-all hover:shadow-md sm:p-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-10 sm:w-10 lg:h-11 lg:w-11 ${s.color}`}>
                <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] text-muted-foreground sm:text-xs lg:text-sm">{s.label}</div>
                <div className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">{s.value}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 sm:mt-4 sm:gap-2">
              <Link
                to={s.link}
                className="flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground transition-colors sm:text-sm"
              >
                View All ›
              </Link>

              {s.withMonth ? (
                <button className="flex items-center gap-1 rounded-lg border border-border px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-[11px]">
                  Month
                  <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              ) : (
                <span className="flex items-center gap-0.5 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success sm:gap-1 sm:px-2.5 sm:py-1 sm:text-xs">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +10%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Activity: views & active users */}
      <div className="mt-3 grid min-w-0 grid-cols-2 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-4">
        {activity.map((s) => (
          <div key={s.label} className="min-w-0 overflow-hidden rounded-2xl bg-card p-3.5 shadow-sm sm:p-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-10 sm:w-10 lg:h-11 lg:w-11 ${s.color}`}>
                <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] text-muted-foreground sm:text-xs lg:text-sm">{s.label}</div>
                <div className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">{statsPending ? "—" : s.value}</div>
              </div>
            </div>
            <div className="mt-3 truncate text-[11px] text-muted-foreground sm:mt-4 sm:text-xs">{s.hint}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:mt-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        
        {/* Recent Movies */}
        <div className="min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold">Recent Movies</h2>
            <Link to="/movies" className="text-sm font-medium text-gold hover:underline">
              View all →
            </Link>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-[72px_minmax(160px,1.4fr)_1fr_1fr_0.9fr] gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs font-semibold text-muted-foreground lg:grid-cols-[80px_minmax(180px,1.5fr)_1fr_1fr_1fr] lg:px-6">
              <div />
              <div>Movie Title</div>
              <div>Date Added</div>
              <div>Status</div>
              <div>Access</div>
            </div>

            {loadingMovies ? (
              <div className="space-y-2 p-5">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : movies.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">No movies uploaded yet.</div>
            ) : (
              movies.map((m) => {
                const isPremium = (m as any).access_level === "PREMIUM";
                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-[72px_minmax(160px,1.4fr)_1fr_1fr_0.9fr] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/40 transition-colors lg:grid-cols-[80px_minmax(180px,1.5fr)_1fr_1fr_1fr] lg:px-6"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-600">
                      {m.thumbnail && (
                        <img
                          src={m.thumbnail.startsWith("http") ? m.thumbnail : `https://cinehubsbackend-production.up.railway.app${m.thumbnail}`}
                          alt={m.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-1 font-medium">{m.title}</div>
                      <div className="text-sm text-muted-foreground">{m.release_year || m.category_names?.[0] || "—"}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatDate(m.created_at)}</div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${isPremium ? "bg-sky-500/10 text-sky-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                        {isPremium ? "Premium" : "Basic"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {loadingMovies ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : movies.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">No movies uploaded yet.</div>
            ) : (
              <div className="space-y-3 p-4">
                {movies.map((m) => {
                  const isPremium = (m as any).access_level === "PREMIUM";
                  return (
                    <div key={m.id} className="rounded-2xl border border-border p-4">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-600">
                          {m.thumbnail && (
                            <img
                              src={m.thumbnail.startsWith("http") ? m.thumbnail : `https://cinehubsbackend-production.up.railway.app${m.thumbnail}`}
                              alt={m.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="line-clamp-2 font-semibold leading-tight">{m.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {m.release_year || m.category_names?.[0] || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isPremium ? "bg-sky-500/10 text-sky-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {isPremium ? "Premium" : "Basic"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Subscription Pricing */}
        <div className="min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4 text-center font-semibold sm:px-6">
            Subscription Pricing
          </div>

          {plans.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No plans found.<br />Create BASIC and PREMIUM plans in Django admin.
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="flex gap-4 border-b border-border px-5 py-5 last:border-0 sm:gap-5 sm:px-6">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/90 sm:h-14 sm:w-14">
                  <Gem className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gold text-lg">{plan.name}</div>
                    <button
                      onClick={() => setOpenPlan(plan)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                  </div>

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Pay-per-movie • Renew when credits are exhausted
                  </p>

                  <div className="mt-3 text-2xl font-bold tracking-tighter">
                    {formatPrice(plan.price)}
                    <span className="text-base font-normal text-muted-foreground"> / movie</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top movies by views */}
      <div className="mt-6 min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm xl:mt-8">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold">Most Viewed Movies</h2>
          <Link to="/reviews" className="text-sm font-medium text-gold hover:underline">
            Reviews →
          </Link>
        </div>
        {loadingStats ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : movieStats.top_movies.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">No views yet.</div>
        ) : (
          <>
            <div className="hidden grid-cols-[40px_minmax(0,1fr)_90px_90px_80px] gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs font-semibold text-muted-foreground sm:grid sm:px-6">
              <div>#</div>
              <div>Movie</div>
              <div className="text-right">Views</div>
              <div className="text-right">Viewers</div>
              <div className="text-right">Rating</div>
            </div>
            {movieStats.top_movies.map((m, i) => (
              <div
                key={m.id}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-3 last:border-0 sm:grid-cols-[40px_minmax(0,1fr)_90px_90px_80px] sm:gap-4 sm:px-6"
              >
                <div className="text-sm font-semibold text-muted-foreground">{i + 1}</div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-600">
                    {m.thumbnail && <img src={m.thumbnail} alt={m.title} className="h-full w-full object-cover" />}
                  </div>
                  <span className="truncate font-medium">{m.title}</span>
                </div>
                <div className="text-right text-sm font-semibold">
                  {formatCount(m.views_count)}
                  <span className="font-normal text-muted-foreground sm:hidden"> views</span>
                </div>
                <div className="hidden text-right text-sm text-muted-foreground sm:block">{formatCount(m.unique_viewers)}</div>
                <div className="hidden text-right text-sm text-muted-foreground sm:block">
                  {m.avg_rating != null ? `★ ${m.avg_rating.toFixed(1)}` : "—"}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {openPlan && (
        <SubscriptionPricingModal
          plan={openPlan}
          onClose={() => setOpenPlan(null)}
          onSaved={(updated) => {
            setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setOpenPlan(null);
          }}
        />
      )}
    </>
  );
}