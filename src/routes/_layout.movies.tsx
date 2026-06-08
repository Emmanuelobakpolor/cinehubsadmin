import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ImageIcon, MoreHorizontal, Trash2, ArrowRight, Pencil, Star, Plus } from "lucide-react";
import { AddMovieModal, type Movie } from "@/components/admin/AddMovieModal";
import { SuccessModal } from "@/components/admin/SuccessModal";
import { API_BASE, getAccessToken } from "@/lib/auth";

export const Route = createFileRoute("/_layout/movies")({
  component: MoviesPage,
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [success, setSuccess] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [featuredMovieId, setFeaturedMovieId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/movies/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list: Movie[] = data.results ?? [];
        setMovies(list);
        const featured = list.find((m) => (m as Movie & { is_featured?: boolean }).is_featured);
        if (featured) setFeaturedMovieId(featured.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSetFeatured = async (id: number) => {
    setMenuId(null);
    const res = await fetch(`${API_BASE}/movies/${id}/set-featured/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (res.ok) setFeaturedMovieId(id);
  };

  const handleDelete = async (id: number) => {
    setMenuId(null);
    const res = await fetch(`${API_BASE}/movies/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (res.ok) {
      setMovies((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSaved = (movie: Movie) => {
    if (editingMovie) {
      setMovies((prev) => prev.map((m) => (m.id === movie.id ? movie : m)));
      setEditingMovie(null);
    } else {
      setMovies((prev) => [movie, ...prev]);
      setAddOpen(false);
    }
    setSuccess(true);
  };

  const empty = !loading && movies.length === 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Movies</h1>
          <p className="text-sm text-muted-foreground">List of Movies in Cinehubs feed</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-3 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gold/90 sm:px-4"
        >
          <Plus className="h-4 w-4" />
          <span>Add Movie</span>
        </button>
      </div>

      <div className="mt-6 min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm">
        {loading ? (
          <div className="space-y-4 p-4 sm:p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : empty ? (
          <div className="grid place-items-center py-20">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 text-center shadow-sm sm:p-12">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-bold">No movie added yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                All uploaded movies on Cinehubs would be displayed here once added.
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold"
              >
                Add new movie <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[80px_1.6fr_1fr_1fr_80px] gap-4 border-b border-border px-6 py-4 text-sm font-semibold">
              <div />
              <div>Movie Title</div>
              <div>Date Added</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {/* Desktop rows */}
            <div className="hidden sm:block">
              {movies.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[80px_1.6fr_1fr_1fr_80px] items-center gap-4 border-b border-border px-6 py-4 last:border-0"
                >
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium line-clamp-1">{m.title}</span>
                      {m.id === featuredMovieId && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold whitespace-nowrap">
                          <Star className="h-3 w-3 fill-gold" /> Featured
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{m.release_year || m.category_names?.[0] || ""}</div>
                  </div>

                  <div>
                    <div className="text-sm">{formatDate(m.created_at)}</div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                    </span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                      className="grid h-10 w-10 place-items-center rounded-md hover:bg-muted"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {menuId === m.id && (
                      <div className="absolute right-0 top-9 z-10 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                        {m.id !== featuredMovieId && (
                          <button
                            onClick={() => handleSetFeatured(m.id)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-gold hover:bg-muted"
                          >
                            Set as Featured <Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingMovie(m);
                            setMenuId(null);
                          }}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                        >
                          Edit Movie <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted"
                        >
                          Delete Movie <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {movies.map((m) => (
                <div key={m.id} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-500">
                      {m.thumbnail && (
                        <img
                          src={m.thumbnail.startsWith("http") ? m.thumbnail : `https://web-production-a39f0a.up.railway.app${m.thumbnail}`}
                          alt={m.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm line-clamp-2">{m.title}</span>
                        {m.id === featuredMovieId && (
                          <span className="inline-flex items-center rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold whitespace-nowrap">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="break-words text-xs text-muted-foreground">{m.release_year || m.category_names?.[0] || ""}</div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(m.created_at)}</span>
                    <span>{(m as any).access_level === "PREMIUM" ? "Premium" : "Basic"}</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted w-full justify-center"
                    >
                      Actions <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuId === m.id && (
                      <div className="absolute left-0 right-0 top-10 z-10 rounded-lg border border-border bg-card p-1 shadow-lg">
                        {m.id !== featuredMovieId && (
                          <button
                            onClick={() => handleSetFeatured(m.id)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm text-gold hover:bg-muted"
                          >
                            Set as Featured <Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingMovie(m);
                            setMenuId(null);
                          }}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-muted"
                        >
                          Edit Movie <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-muted"
                        >
                          Delete Movie <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AddMovieModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleSaved}
      />

      <AddMovieModal
        open={!!editingMovie}
        onClose={() => setEditingMovie(null)}
        onAdd={handleSaved}
        editMovie={editingMovie}
      />

      <SuccessModal open={success} onClose={() => setSuccess(false)} />
    </>
  );
}