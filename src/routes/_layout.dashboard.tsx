import { createFileRoute } from "@tanstack/react-router";
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
      .then(([u, m]) => { setUserStats(u); setMovieStats(m); })
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
    { label: "Total Users", value: loadingStats ? "—" : String(userStats.total_users), icon: Users, color: "bg-gold text-white" },
    { label: "Basic Subs", value: loadingStats ? "—" : String(userStats.basic_subs), icon: Star, color: "bg-emerald-500 text-white" },
    { label: "Premium Subs", value: loadingStats ? "—" : String(userStats.premium_subs), icon: Star, color: "bg-sky-500 text-white" },
    { label: "Total Movies", value: loadingStats ? "—" : String(movieStats.total_movies), icon: Film, color: "bg-amber-300 text-white", withMonth: true },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className={`grid h-12 w-12 place-items-center rounded-full ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="mt-1 text-2xl font-bold">{s.value}</div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <button className="flex items-center gap-1 text-sm font-medium text-foreground/80">
                View All <span>›</span>
              </button>
              {s.withMonth ? (
                <button className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs">
                  Month <ChevronDown className="h-3 w-3" />
                </button>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-xs font-medium text-success">
                  <TrendingUp className="h-3 w-3" /> 10.0%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Movies table */}
        <div className="rounded-2xl bg-card shadow-sm">
          <div className="grid grid-cols-[80px_1.4fr_1fr_1fr_0.8fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold">
            <div />
            <div>Movie Title</div>
            <div>Date Added</div>
            <div>Status</div>
            <div>Sub Type</div>
          </div>
          {loadingMovies ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : movies.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No movies yet.</div>
          ) : (
            movies.map((m) => (
              <div key={m.id} className="grid grid-cols-[80px_1.4fr_1fr_1fr_0.8fr] items-center gap-4 border-b border-border px-6 py-4 last:border-0">
                <div className="h-14 w-14 overflow-hidden rounded-md bg-slate-500">
                  {m.thumbnail && (
                    <img
                      src={m.thumbnail.startsWith("http") ? m.thumbnail : `https://web-production-a39f0a.up.railway.app${m.thumbnail}`}
                      alt={m.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <div className="font-medium line-clamp-1">{m.title}</div>
                  <div className="text-sm text-muted-foreground">{m.release_year || m.category_names?.[0] || ""}</div>
                </div>
                <div className="text-sm">{formatDate(m.created_at)}</div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                  </span>
                </div>
                <div className="text-sm">{m.access_level === "PREMIUM" ? "Premium" : "Basic"}</div>
              </div>
            ))
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4 text-center font-semibold">
              Subscription Pricing
            </div>
            {plans.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No plans found. Create BASIC and PREMIUM plans in Django admin.
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="flex items-start gap-4 border-b border-border px-6 py-5 last:border-0">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gold/90">
                    <Gem className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gold">{plan.name}</div>
                      <button
                        onClick={() => setOpenPlan(plan)}
                        className="flex items-center gap-1 text-sm font-medium text-foreground/80"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This will be charged only per movie, when exhausted you'll need to subscribe again
                    </p>
                    <div className="mt-2 text-xl font-bold">
                      {formatPrice(plan.price)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">/ movie</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
