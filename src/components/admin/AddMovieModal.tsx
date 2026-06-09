import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/BaseModal";
import TouchButton from "@/components/ui/TouchButton";
import { X, Upload, ImageIcon, Check, Pencil, Minimize2 } from "lucide-react";
import { API_BASE, getAccessToken } from "@/lib/auth";
import { useUploadContext } from "@/context/UploadContext";

export interface Movie {
  id: number;
  title: string;
  synopsis: string;
  thumbnail: string;
  movie_file: string;
  trailer_url?: string;
  categories: number[];
  category_names: string[];
  cast: string;
  release_year: string;
  runtime: string;
  rating: string;
  director: string;
  views_count: number;
  is_trending: boolean;
  is_featured: boolean;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export function AddMovieModal({
  open,
  onClose,
  onAdd,
  editMovie,
  minimized = false,
  onMinimize,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (movie: Movie) => void;
  editMovie?: Movie | null;
  minimized?: boolean;
  onMinimize?: () => void;
}) {
  const isEdit = !!editMovie;
  const uploadCtx = useUploadContext();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [runtime, setRuntime] = useState("");
  const [rating, setRating] = useState("");
  const [director, setDirector] = useState("");
  const [cast, setCast] = useState(
    Array.from({ length: 10 }, () => ({ name: "", role: "" }))
  );
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [trailerClipFile, setTrailerClipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null); // null=idle, 0-100=transferring, 101=processing
  const [error, setError] = useState("");

  // Pre-populate when in edit mode
  useEffect(() => {
    if (open) {
      if (editMovie) {
        setTitle(editMovie.title);
        setSynopsis(editMovie.synopsis);
        setReleaseYear(editMovie.release_year ?? "");
        setRuntime(editMovie.runtime ?? "");
        setRating(editMovie.rating ?? "");
        setDirector(editMovie.director ?? "");
        setSelectedCategoryIds(editMovie.categories ?? []);
        // Parse cast string back into rows
        const parts = editMovie.cast
          ? editMovie.cast.split(",").map((s) => s.trim())
          : [];
        const rows = Array.from({ length: 10 }, (_, i) => i).map((i) => {
          const part = parts[i] ?? "";
          const match = part.match(/^(.+?)\s*\((.+)\)$/);
          return match
            ? { name: match[1].trim(), role: match[2].trim() }
            : { name: part, role: "" };
        });
        setCast(rows);
      } else {
        // Reset for create mode
        setVideoFile(null);
        setPosterFile(null);
        setTitle("");
        setSynopsis("");
        setReleaseYear("");
        setRuntime("");
        setRating("");
        setDirector("");
        setCast(Array.from({ length: 10 }, () => ({ name: "", role: "" })));
        setTrailerClipFile(null);
        setSelectedCategoryIds([]);
      }
      setError("");
    }
  }, [open, editMovie]);

  // Fetch categories from API
  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/movies/categories/?page_size=200`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setApiCategories(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => {});
  }, [open]);

  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) return setError("Movie title is required.");
    if (!synopsis.trim()) return setError("Synopsis is required.");
    if (selectedCategoryIds.length === 0) return setError("Please select at least one category.");
    if (!isEdit && !videoFile) return setError("Please select a video file.");
    if (!isEdit && !posterFile) return setError("Please select a movie poster.");

    const castStr = cast
      .filter((c) => c.name.trim())
      .map((c) => (c.role.trim() ? `${c.name.trim()} (${c.role.trim()})` : c.name.trim()))
      .join(", ");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("synopsis", synopsis.trim());
    fd.append("release_year", releaseYear.trim());
    fd.append("runtime", runtime.trim());
    fd.append("rating", rating.trim());
    fd.append("director", director.trim());
    fd.append("cast", castStr);
    selectedCategoryIds.forEach((id) => fd.append("categories", String(id)));
    if (trailerClipFile) fd.append("thriller_clip", trailerClipFile);
    if (videoFile) fd.append("movie_file", videoFile);
    if (posterFile) fd.append("thumbnail", posterFile);

    const url = isEdit ? `${API_BASE}/movies/${editMovie!.id}/` : `${API_BASE}/movies/`;
    const method = isEdit ? "PATCH" : "POST";

    setLoading(true);
    setUploadPct(0);
    uploadCtx.notifyStart(title.trim() || "Movie");

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();

      // Track the browser→server file transfer (phase 1)
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadPct(pct);
          uploadCtx.notifyProgress(pct);
        }
      });

      // File fully received by Django — now it's uploading to Cloudinary (phase 2)
      xhr.upload.addEventListener("loadend", () => {
        setUploadPct(101);
        uploadCtx.notifyProcessing();
      });

      xhr.addEventListener("load", () => {
        setLoading(false);
        setUploadPct(null);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status < 200 || xhr.status >= 300) {
            const msg = Object.values(data).flat().join(" ") || "Something went wrong.";
            setError(String(msg));
            uploadCtx.notifyError(String(msg));
          } else {
            uploadCtx.notifyDone();
            onAdd(data as Movie);
          }
        } catch {
          setError("Unexpected response from server.");
          uploadCtx.notifyError("Unexpected response from server.");
        }
        resolve();
      });

      xhr.addEventListener("error", () => {
        setLoading(false);
        setUploadPct(null);
        setError("Could not connect to the server.");
        uploadCtx.notifyError("Could not connect to the server.");
        resolve();
      });

      xhr.addEventListener("abort", () => {
        setLoading(false);
        setUploadPct(null);
        setError("Upload was cancelled.");
        uploadCtx.notifyError("Upload was cancelled.");
        resolve();
      });

      xhr.open(method, url);
      xhr.setRequestHeader("Authorization", `Bearer ${getAccessToken()}`);
      xhr.send(fd);
    });
  };

  if (!open || minimized) return null;

  return (
    <BaseModal
      open={open}
      onClose={() => {
        if (loading) uploadCtx.minimize();
        onClose();
      }}
      className="!max-w-2xl p-0"
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden"
        style={{ animation: "fadeIn 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h2 className="text-base font-bold sm:text-lg">
              {isEdit ? "Edit Movie" : "Add New Movie"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? "Update the movie details below"
                : "Upload a movie to the Cinehubs platform"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {loading && onMinimize && (
              <TouchButton
                onClick={() => { uploadCtx.minimize(); onMinimize(); }}
                className="bg-transparent hover:bg-muted"
                title="Minimize — upload continues in background"
              >
                <Minimize2 className="h-4 w-4" />
              </TouchButton>
            )}
            <TouchButton
              onClick={() => {
                if (loading) uploadCtx.minimize();
                onClose();
              }}
              className="bg-transparent hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </TouchButton>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-6 sm:py-5 sm:space-y-5">

          {/* Upload zones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Video upload */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/50 bg-gold/5 p-3 sm:p-4 text-center transition-colors hover:border-gold hover:bg-gold/10">
              <Upload className="h-8 w-8 text-gold" />
              <p className="text-sm font-medium">
                {videoFile ? videoFile.name : isEdit ? "Replace video (optional)" : "Drop video file here"}
              </p>
              <p className="text-xs text-muted-foreground">MP4, MOV · Max 8 GB · 4K supported</p>
              <span className="mt-1 rounded-lg border border-gold/40 px-3 sm:px-4 py-1.5 text-xs font-medium text-gold">
                Browse File
              </span>
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {/* Poster upload */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-3 sm:p-4 text-center transition-colors hover:border-gold hover:bg-gold/5">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {posterFile ? posterFile.name : isEdit ? "Replace poster (optional)" : "Movie Poster"}
              </p>
              <p className="text-xs text-muted-foreground">JPG, PNG · Max 5 MB</p>
              <span className="mt-1 rounded-lg border border-border px-3 sm:px-4 py-1.5 text-xs font-medium">
                Browse Image
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Title + Synopsis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Movie Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter movie title"
                className="w-full rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Synopsis</label>
              <textarea
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Write a compelling synopsis..."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Release Year</label>
              <input
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                placeholder="2025"
                className="w-full rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Runtime</label>
              <input
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                placeholder="142 min"
                className="w-full rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Rating</label>
              <input
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="18+"
                className="w-full rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>
          </div>

          {/* Director */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Director</label>
            <input
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="Director's full name"
              className="w-full rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
          </div>

          {/* Trailer clip upload */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Trailer Clip{" "}
              <span className="text-muted-foreground font-normal">(optional — upload a short .mp4 clip, recommended)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 sm:gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 px-3 sm:px-4 py-3 sm:py-4 transition-colors hover:border-gold hover:bg-gold/5">
              <Upload className="h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {trailerClipFile ? trailerClipFile.name : isEdit ? "Replace trailer clip (optional)" : "Upload trailer clip"}
                </p>
                <p className="text-xs text-muted-foreground">MP4 · Max 500 MB · This plays automatically in the app</p>
              </div>
              <span className="shrink-0 rounded-lg border border-gold/40 px-2 sm:px-3 py-1 text-xs font-medium text-gold whitespace-nowrap">
                Browse
              </span>
              <input
                type="file"
                accept="video/mp4,video/*"
                className="sr-only"
                onChange={(e) => setTrailerClipFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>


          {/* Categories */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Categories
              {selectedCategoryIds.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gold">{selectedCategoryIds.length} selected</span>
              )}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {apiCategories.map((cat) => {
                const active = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategoryIds((prev) =>
                        active ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                      )
                    }
                    className={`flex items-center justify-center gap-1 rounded-full border px-2 sm:px-4 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    {active && <Check className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
              {apiCategories.length === 0 && (
                <p className="col-span-2 sm:col-span-3 md:col-span-4 text-xs text-muted-foreground">Loading categories…</p>
              )}
            </div>
          </div>

          {/* Cast & Roles */}
          <div>
            <label className="mb-2 block text-sm font-medium">Cast & Roles</label>
            <div className="space-y-2">
              {cast.map((c, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <input
                    value={c.name}
                    onChange={(e) =>
                      setCast((prev) =>
                        prev.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r))
                      )
                    }
                    placeholder={`Cast ${i + 1} — Full name`}
                    className="rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
                  />
                  <input
                    value={c.role}
                    onChange={(e) =>
                      setCast((prev) =>
                        prev.map((r, idx) => (idx === i ? { ...r, role: e.target.value } : r))
                      )
                    }
                    placeholder="Role (e.g. Lead Actor)"
                    className="rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 py-3 sm:px-6 sm:py-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white transition-all hover:bg-gold/90 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {uploadPct === null || uploadPct === 0
                  ? (isEdit ? "Saving…" : "Uploading…")
                  : uploadPct <= 100
                    ? `Uploading… ${uploadPct}%`
                    : "Processing… saving to cloud storage"}
              </>
            ) : isEdit ? (
              <>
                <Pencil className="h-4 w-4" /> Save Changes
              </>
            ) : (
              "Add Movie to Catalog"
            )}
          </button>

          {/* Upload progress bar — visible during file transfer phase */}
          {uploadPct !== null && uploadPct <= 100 && (
            <div className="mt-3 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-200"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {uploadPct < 100
                  ? `Sending to server… ${uploadPct}%`
                  : "File received — processing with cloud storage…"}
              </p>
            </div>
          )}

          {/* Processing spinner — shown after 100% while Cloudinary works */}
          {uploadPct === 101 && (
            <p className="mt-3 text-center text-xs text-muted-foreground animate-pulse">
              ☁️ Saving to cloud storage — this may take a few minutes for large files…
            </p>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
