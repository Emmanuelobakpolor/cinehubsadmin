import { createFileRoute } from "@tanstack/react-router";
import { Filter, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { API_BASE, getAccessToken } from "@/lib/auth";

export const Route = createFileRoute("/_layout/subscribers")({
  component: SubscribersPage,
});

interface Subscriber {
  id: number;
  username: string;
  email: string;
  plan_name: "BASIC" | "PREMIUM";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  is_active: boolean;
  start_date: string;
  end_date: string;
}

interface Counts {
  total: number;
  basic: number;
  premium: number;
  active: number;
}

type PlanFilter = "ALL" | "BASIC" | "PREMIUM";
type StatusFilter = "ALL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 15;

function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, basic: 0, premium: 0, active: 0 });
  const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (planFilter !== "ALL") params.set("plan", planFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    fetch(`${API_BASE}/subscriptions/subscribers/?${params}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setCounts(data.counts ?? { total: 0, basic: 0, premium: 0, active: 0 });
        setSubscribers(Array.isArray(data.results) ? data.results : []);
        setPage(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [planFilter, statusFilter]);

  const paginated = subscribers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(subscribers.length / PAGE_SIZE));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${counts.total} total subscribers`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <Pill
          color="bg-sky-500"
          label="All Subscribers"
          value={String(counts.total)}
          active={planFilter === "ALL"}
          onClick={() => { setPlanFilter("ALL"); setPage(0); }}
        />
        <Pill
          color="bg-gold"
          label="Basic"
          value={String(counts.basic)}
          active={planFilter === "BASIC"}
          onClick={() => { setPlanFilter("BASIC"); setPage(0); }}
        />
        <Pill
          color="bg-rose-500"
          label="Premium"
          value={String(counts.premium)}
          active={planFilter === "PREMIUM"}
          onClick={() => { setPlanFilter("PREMIUM"); setPage(0); }}
        />
        {/* Status filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm transition-colors ${
              statusFilter !== "ALL"
                ? "bg-primary/10 ring-2 ring-primary text-primary"
                : "bg-card"
            }`}
          >
            <Filter className="h-4 w-4" />
            {statusFilter === "ALL" ? "Filters" : statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[160px] rounded-xl border border-border bg-card py-1.5 shadow-lg">
              {(["ALL", "ACTIVE", "EXPIRED", "CANCELLED"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setFilterOpen(false); setPage(0); }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
                    statusFilter === s ? "font-semibold text-primary" : ""
                  }`}
                >
                  {s === "ACTIVE" && <span className="h-2 w-2 rounded-full bg-green-500" />}
                  {s === "EXPIRED" && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                  {s === "CANCELLED" && <span className="h-2 w-2 rounded-full bg-gray-400" />}
                  {s === "ALL" && <span className="h-2 w-2 rounded-full bg-sky-400" />}
                  {s === "ALL" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="shrink-0 rounded-2xl border-2 border-fuchsia-400 px-5 py-2.5 text-sm font-semibold text-fuchsia-500 transition-opacity hover:opacity-80"
          onClick={() => { setPlanFilter("ALL"); setStatusFilter("ALL"); setPage(0); }}
        >
          Show all
        </button>
        </div>

      <div className="mt-6 rounded-2xl bg-card shadow-sm overflow-hidden">
        {loading ? (
          <>
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-6 py-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-1">
                  <div className="h-3 w-28 rounded bg-muted" />
                  <div className="h-2.5 w-36 rounded bg-muted" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="sm:hidden border-b border-border p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-2.5 w-36 rounded bg-muted" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-muted" />
                  <div className="h-6 w-20 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </>
        ) : paginated.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">No subscribers found.</div>
        ) : (
          <>
            {/* Desktop rows */}
            <div className="hidden sm:block">
              {paginated.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-6 py-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-muted font-semibold text-sm uppercase">
                      {r.username.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{r.username}</div>
                      <div className="text-sm text-muted-foreground">{r.email}</div>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded-full px-4 py-1 text-xs font-semibold ${
                        r.plan_name === "BASIC"
                          ? "bg-basic-soft text-basic"
                          : "bg-premium-soft text-premium"
                      }`}
                    >
                      {r.plan_name}
                    </span>
                  </div>
                  <div>
                    {r.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{" "}
                        {r.status === "CANCELLED" ? "Cancelled" : "Expired"}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDate(r.start_date)}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(r.end_date)}</div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3 p-4">
              {paginated.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted font-bold uppercase text-sm">
                      {r.username.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{r.username}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                    </div>
                    <span
                      className={`inline-block shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        r.plan_name === "BASIC"
                          ? "bg-basic-soft text-basic"
                          : "bg-premium-soft text-premium"
                      }`}
                    >
                      {r.plan_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {r.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-[11px] font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{" "}
                        {r.status === "CANCELLED" ? "Cancelled" : "Expired"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-xs">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Started</span>
                      <span className="mt-0.5 block font-medium text-foreground">{formatDate(r.start_date)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Expires</span>
                      <span className="mt-0.5 block font-medium text-foreground">{formatDate(r.end_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6 sm:py-4">
          <button
            className="rounded-lg border border-border px-4 py-3 text-sm disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <button
            className="rounded-lg border border-border px-4 py-3 text-sm disabled:opacity-40"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {subscribers.length === 0 ? "0" : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, subscribers.length)}`} of {subscribers.length}
          </span>
        </div>
      </div>
    </>
  );
}

function Pill({
  color,
  label,
  value,
  active,
  onClick,
}: {
  color: string;
  label: string;
  value: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-3 shadow-sm transition-colors min-w-[100px] sm:flex-1 sm:min-w-[130px] sm:gap-3 sm:px-5 sm:py-4 ${
        active ? "bg-primary/10 ring-2 ring-primary" : "bg-card"
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 sm:h-6 sm:w-6 ${color.replace("bg-", "border-")}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${color}`} />
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold sm:text-sm">{label}</span>
      <span className="shrink-0 font-bold text-xs sm:text-sm">{value}</span>
    </button>
  );
}
