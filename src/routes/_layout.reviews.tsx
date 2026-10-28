import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, Pencil, X, Star } from "lucide-react";
import { API_BASE, getAccessToken } from "@/lib/auth";
import { SuccessModal } from "@/components/admin/SuccessModal";

export const Route = createFileRoute("/_layout/reviews")({
  component: ReviewsPage,
});

interface Review {
  id: number;
  movie: number;
  movie_title: string;
  display_name: string;
  username: string;
  rating: number;
  comment: string;
  is_custom: boolean;
  created_at: string;
}

interface MovieOption {
  id: number;
  title: string;
}

interface FormState {
  movie: string;
  display_name: string;
  rating: number;
  comment: string;
}

const emptyForm: FormState = { movie: "", display_name: "", rating: 5, comment: "" };

function authHeaders(json = false): HeadersInit {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          className={onChange ? "p-0.5" : "cursor-default"}
        >
          <Star className={`${onChange ? "h-6 w-6" : "h-3.5 w-3.5"} ${i <= value ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [movieFilter, setMovieFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; review: Review } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/movies/?page_size=500&ordering=title`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const list: MovieOption[] = Array.isArray(data) ? data : (data.results ?? []);
        setMovies(list.map((m) => ({ id: m.id, title: m.title })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = movieFilter ? `?movie=${movieFilter}` : "";
    fetch(`${API_BASE}/reviews/admin/${qs}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : (data.results ?? []));
        setNextUrl(data.next ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [movieFilter]);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      const data = await fetch(nextUrl, { headers: authHeaders() }).then((r) => r.json());
      setReviews((prev) => [...prev, ...(data.results ?? [])]);
      setNextUrl(data.next ?? null);
    } finally {
      setLoadingMore(false);
    }
  };

  const openAdd = () => {
    setError("");
    setForm({ ...emptyForm, movie: movieFilter });
    setModal({ mode: "add" });
  };

  const openEdit = (review: Review) => {
    setError("");
    setForm({
      movie: String(review.movie),
      display_name: review.display_name || (review.is_custom ? review.username : ""),
      rating: review.rating,
      comment: review.comment,
    });
    setModal({ mode: "edit", review });
  };

  const handleSave = async () => {
    if (!modal) return;
    setError("");
    const isCustom = modal.mode === "add" || modal.review.is_custom;
    if (!form.movie) return setError("Select a movie.");
    if (isCustom && !form.display_name.trim()) return setError("Username is required.");

    setSaving(true);
    try {
      const url = modal.mode === "add" ? `${API_BASE}/reviews/admin/` : `${API_BASE}/reviews/admin/${modal.review.id}/`;
      const res = await fetch(url, {
        method: modal.mode === "add" ? "POST" : "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({
          movie: Number(form.movie),
          display_name: form.display_name.trim(),
          rating: form.rating,
          comment: form.comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Object.values(data).flat().join(" ") || "Failed to save review");

      setReviews((prev) =>
        modal.mode === "add" ? [data, ...prev] : prev.map((r) => (r.id === data.id ? data : r)),
      );
      setModal(null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!window.confirm(`Delete the review by "${review.username}"?`)) return;
    const res = await fetch(`${API_BASE}/reviews/admin/${review.id}/`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== review.id));
  };

  const isCustomForm = modal?.mode === "add" || (modal?.mode === "edit" && modal.review.is_custom);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Reviews</h1>
          <p className="text-sm text-muted-foreground">Moderate reviews and add your own under any username</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={movieFilter}
            onChange={(e) => setMovieFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="">All movies</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gold/90"
          >
            <Plus className="h-4 w-4" /> Add Review
          </button>
        </div>
      </div>

      <div className="mt-6 min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="grid place-items-center py-20 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-muted">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-xl font-bold">No reviews yet</h3>
            <button onClick={openAdd} className="mt-4 text-sm font-semibold text-gold">
              Add a review →
            </button>
          </div>
        ) : (
          <>
            {reviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-0 sm:flex-row sm:items-start sm:px-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 font-semibold text-gold">
                  {(r.username || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{r.username}</span>
                    {r.is_custom && (
                      <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600">Admin-added</span>
                    )}
                    <Stars value={r.rating} />
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {r.movie_title} · {formatDate(r.created_at)}
                  </div>
                  {r.comment && <p className="mt-2 break-words text-sm">{r.comment}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(r)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted sm:flex-none"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {nextUrl && (
              <div className="p-4 text-center">
                <button onClick={loadMore} disabled={loadingMore} className="text-sm font-semibold text-gold disabled:opacity-60">
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold">{modal.mode === "add" ? "Add Review" : "Edit Review"}</h2>
                <p className="text-xs text-muted-foreground">
                  {isCustomForm ? "Shown publicly under the username you choose" : `Review by ${modal.mode === "edit" ? modal.review.username : ""}`}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Movie</label>
                <select
                  value={form.movie}
                  onChange={(e) => setForm({ ...form, movie: e.target.value })}
                  disabled={modal.mode === "edit"}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                >
                  <option value="">Select a movie</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Username{!isCustomForm && <span className="font-normal text-muted-foreground"> (optional override)</span>}
                </label>
                <input
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder={isCustomForm ? "e.g., MovieBuff99" : modal.mode === "edit" ? modal.review.username : ""}
                  maxLength={60}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Rating</label>
                <Stars value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Comment</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  rows={4}
                  placeholder="Write the review..."
                  className="w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="border-t border-border px-5 py-4 sm:px-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white transition-all hover:bg-gold/90 disabled:opacity-60"
              >
                {saving ? "Saving..." : modal.mode === "add" ? "Add Review" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SuccessModal open={success} onClose={() => setSuccess(false)} />
    </>
  );
}
