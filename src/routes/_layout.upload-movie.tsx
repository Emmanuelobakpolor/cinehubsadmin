import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Upload, Film, Folder } from "lucide-react";
import { AddMovieModal, type Movie } from "@/components/admin/AddMovieModal";
import { SuccessModal } from "@/components/admin/SuccessModal";
import { API_BASE, getAccessToken } from "@/lib/auth";

export const Route = createFileRoute("/_layout/upload-movie")({
  component: UploadMoviePage,
});

function formatStorage(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${bytes} B`;
}

function UploadMoviePage() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<{ total_movies: number; this_month: number; storage_bytes: number } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/movies/stats/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const statCards = [
    { icon: Film, title: "Movies Added", value: stats ? String(stats.total_movies) : "—", sub: "Total in catalog" },
    { icon: Upload, title: "This Month", value: stats ? String(stats.this_month) : "—", sub: "New uploads" },
    { icon: Folder, title: "Storage Used", value: stats ? formatStorage(stats.storage_bytes) : "—", sub: "Media files" },
  ];

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Upload Movie</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Add a new movie to the Cinehubs catalog</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gold/90 active:scale-[0.98] sm:w-auto sm:px-5 sm:py-2.5"
          >
            <Upload className="h-4 w-4" />
            Upload Movie
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {statCards.map(({ icon: Icon, title, value, sub }) => (
            <div key={title} className="rounded-2xl bg-card px-3 sm:px-4 py-4 shadow-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full bg-gold/10">
                  <Icon className="h-4 sm:h-5 w-4 sm:w-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground truncate">{title}</div>
                  <div className="text-base sm:text-lg font-bold break-words">{value}</div>
                  <div className="text-xs text-muted-foreground truncate">{sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={() => setOpen(true)}
          className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gold/30 bg-gold/5 px-3 sm:px-4 py-8 sm:py-16 text-center transition-all hover:border-gold/60 hover:bg-gold/10"
        >
          <div className="grid h-12 sm:h-14 w-12 sm:w-14 place-items-center rounded-2xl bg-gold/15 transition-transform group-hover:scale-110">
            <Upload className="h-6 sm:h-7 w-6 sm:w-7 text-gold" />
          </div>
          <div>
            <p className="font-semibold text-sm sm:text-base">Click to upload a new movie</p>
            <p className="text-xs sm:text-sm text-muted-foreground">MP4, MOV supported · up to 8 GB</p>
          </div>
        </div>
      </div>

      <AddMovieModal
        open={open}
        minimized={minimized}
        onMinimize={() => { setMinimized(true); setOpen(false); }}
        onClose={() => { setOpen(false); setMinimized(false); }}
        onAdd={(_movie: Movie) => {
          setOpen(false);
          setMinimized(false);
          setSuccess(true);
          // Refresh stats
          fetch(`${API_BASE}/movies/stats/`, {
            headers: { Authorization: `Bearer ${getAccessToken()}` },
          })
            .then((r) => r.json())
            .then(setStats)
            .catch(() => {});
        }}
      />
      <SuccessModal open={success} onClose={() => setSuccess(false)} />
    </>
  );
}
