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
            <div key={title} className="rounded-2xl bg-card px-4 py-4 shadow-sm sm:px-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{title}</div>
                  <div className="text-lg font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={() => setOpen(true)}
          className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gold/30 bg-gold/5 px-4 py-10 text-center transition-all hover:border-gold/60 hover:bg-gold/10 sm:py-16"
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
            <Upload className="h-7 w-7 text-gold sm:h-8 sm:w-8" />
          </div>
          <div>
            <p className="font-semibold">Click to upload a new movie</p>
            <p className="text-sm text-muted-foreground">MP4, MOV supported · up to 8 GB</p>
          </div>
        </div>
      </div>

      <AddMovieModal
        open={open}
        onClose={() => setOpen(false)}
        onAdd={(_movie: Movie) => {
          setOpen(false);
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
