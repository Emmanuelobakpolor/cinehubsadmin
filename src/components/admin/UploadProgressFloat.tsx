import { CloudUpload, CheckCircle, AlertCircle, X } from "lucide-react";
import { useUploadContext } from "@/context/UploadContext";

export function UploadProgressFloat() {
  const { phase, pct, label, error, dismiss } = useUploadContext();

  if (phase === "idle") return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-72 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          {phase === "done" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
          ) : phase === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <CloudUpload className="h-4 w-4 shrink-0 text-gold animate-pulse" />
          )}
          <span className="text-xs font-semibold truncate">{label || "Uploading movie…"}</span>
        </div>
        {(phase === "done" || phase === "error") && (
          <button
            onClick={dismiss}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {phase === "transferring" && (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Uploading to server… <span className="font-medium text-foreground">{pct}%</span>
            </p>
          </>
        )}

        {phase === "processing" && (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full rounded-full bg-gold/50 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">
              ☁️ Saving to cloud storage — may take a few minutes…
            </p>
          </>
        )}

        {phase === "done" && (
          <p className="text-xs font-medium text-green-500">Upload complete! Movie added to catalog.</p>
        )}

        {phase === "error" && (
          <p className="text-xs text-destructive">{error || "Upload failed."}</p>
        )}
      </div>
    </div>
  );
}
