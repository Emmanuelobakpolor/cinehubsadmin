import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Star, Film, TrendingUp, ChevronDown, Gem, Edit } from "lucide-react";
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

function Dashboard() {
  const [openPlan, setOpenPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userStats, setUserStats] = useState({ total_users: 0, basic_subs: 0, premium_subs: 0 });
  const [movieStats, setMovieStats] = useState({ total_movies: 0 });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
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
      fetch(`${API_BASE}/users/dashboard-stats/`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/movies/stats/`, { headers }).then((r) => r.json()),
    ])
      .then(([u, m]) => {
        setUserStats(u);
        setMovieStats(m);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    fetch(`${API_BASE}/movies/?page_size=6`, { headers })
      .then((r) => r.json())
      .then((data) => setMovies(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoadingMovies(false));

    fetchPlans();
  }, []);

  const stats = [
    { label: "Total Users", value: loadingStats ? "—" : String(userStats.total_users), icon: Users, color: "bg-gold text-white", link: "/subscribers" },
    { label: "Basic Subs", value: loadingStats ? "—" : String(userStats.basic_subs), icon: Star, color: "bg-emerald-500 text-white", link: "/subscribers" },
    { label: "Premium Subs", value: loadingStats ? "—" : String(userStats.premium_subs), icon: Star, color: "bg-sky-500 text-white", link: "/subscribers" },
    { label: "Total Movies", value: loadingStats ? "—" : String(movieStats.total_movies), icon: Film, color: "bg-amber-300 text-white", withMonth: true, link: "/movies" },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 overflow-hidden rounded-2xl bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground sm:text-sm">{s.label}</div>
                <div className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">{s.value}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Link
                to={s.link}
                className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                View All <span>›</span>
              </Link>

              {s.withMonth ? (
                <button className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs">
                  This Month <ChevronDown className="h-3 w-3" />
                </button>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                  <TrendingUp className="h-3 w-3" /> +10%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:mt-8 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        
        {/* Recent Movies */}
        <div className="min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold">Recent Movies</h2>
            <Link to="/movies" className="text-sm font-medium text-gold hover:underline">
              View all →
            </Link>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
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
                          src={m.thumbnail.startsWith("http") ? m.thumbnail : `https://web-production-a39f0a.up.railway.app${m.thumbnail}`}
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
          {!loadingMovies && movies.length > 0 && (
            <div className="space-y-3 p-4 md:hidden">
              {movies.map((m) => {
                const isPremium = (m as any).access_level === "PREMIUM";
                return (
                  <div key={m.id} className="rounded-2xl border border-border p-4">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-600">
                        {m.thumbnail && (
                          <img
                            src={m.thumbnail.startsWith("http") ? m.thumbnail : `https://web-production-a39f0a.up.railway.app${m.thumbnail}`}
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

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{formatDate(m.created_at)}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                        Active
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${isPremium ? "bg-sky-500/10 text-sky-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                        {isPremium ? "Premium Access" : "Basic Access"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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