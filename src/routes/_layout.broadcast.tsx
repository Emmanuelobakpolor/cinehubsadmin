import { createFileRoute } from "@tanstack/react-router";
import { Radio, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { API_BASE, getAccessToken } from "@/lib/auth";

export const Route = createFileRoute("/_layout/broadcast")({
  component: BroadcastPage,
});

type Audience = "ALL" | "BASIC" | "PREMIUM";

interface Broadcast {
  id: number;
  title: string;
  message: string;
  target_audience: Audience;
  created_at: string;
  is_read: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL: "All Users",
  BASIC: "Basic",
  PREMIUM: "Premium",
};

const AUDIENCE_BADGE: Record<Audience, string> = {
  ALL: "bg-muted text-muted-foreground",
  BASIC: "bg-gold-soft text-gold",
  PREMIUM: "bg-sky-100 text-sky-600",
};

function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/notifications/broadcast/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setBroadcasts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openModal() {
    setModalOpen(true);
  }

  function handleSent(newBroadcast: Broadcast) {
    setBroadcasts((prev) => [newBroadcast, ...prev]);
    setModalOpen(false);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <>
        <div className="rounded-2xl bg-card p-6 text-center shadow-sm sm:p-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-soft">
            <Radio className="h-9 w-9 text-gold" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Push Broadcast</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, manage and send push broadcasts to your users.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">No broadcast added yet.</p>
          <button
            onClick={openModal}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold hover:bg-gold/90 active:scale-[0.98]"
          >
            <Radio className="h-4 w-4" />
            Create New Broadcast
          </button>
        </div>

        {modalOpen && (
          <BroadcastModal
            onClose={() => setModalOpen(false)}
            onSent={handleSent}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Push Broadcast</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create, manage and send push broadcasts to your users.
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold hover:bg-gold/90 active:scale-[0.98]"
        >
          <Radio className="h-4 w-4" />
          New Broadcast
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {broadcasts.map((b) => (
          <BroadcastCard key={b.id} broadcast={b} />
        ))}
      </div>

      {modalOpen && (
        <BroadcastModal
          onClose={() => setModalOpen(false)}
          onSent={handleSent}
        />
      )}
    </>
  );
}

function BroadcastCard({ broadcast }: { broadcast: Broadcast }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm">
      <div className="flex h-32 items-center justify-center bg-muted">
        <Radio className="h-10 w-10 text-muted-foreground/40" />
      </div>

      <span
        className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${AUDIENCE_BADGE[broadcast.target_audience]}`}
      >
        {AUDIENCE_LABELS[broadcast.target_audience]}
      </span>

      <div className="px-4 py-3">
        <p className="line-clamp-1 text-sm font-semibold">{broadcast.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(broadcast.created_at)}
        </p>
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {broadcast.message}
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">Active</span>
        <label className="relative ml-auto inline-flex cursor-pointer items-center">
          <input type="checkbox" defaultChecked className="peer sr-only" />
          <div className="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-gold after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
        </label>
      </div>
    </div>
  );
}

function BroadcastModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: (b: Broadcast) => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!title.trim()) return setError("Title is required.");
    if (!message.trim()) return setError("Message is required.");
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/notifications/broadcast/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          target_audience: audience,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data?.detail ||
          Object.values(data).flat().join(" ") ||
          "Failed to send broadcast.";
        throw new Error(String(msg));
      }
      // Refetch list to get the newly created broadcast with server-generated id/timestamp
      const listRes = await fetch(`${API_BASE}/notifications/broadcast/`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      const listData = await listRes.json();
      const newest = Array.isArray(listData) ? listData[0] : null;
      if (newest) onSent(newest);
      else onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred.");
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-5 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Send Push Broadcast</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compose and send a notification that reaches users in their app.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <input
              type="text"
              className={inputCls}
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Message</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              placeholder="Write your broadcast message here…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Target by Audience
            </label>
            <select
              className={inputCls}
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
            >
              <option value="ALL">All Users</option>
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        {/* Footer */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted"
          >
            Discard Draft
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold hover:bg-gold/90 active:scale-[0.99] disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send Now"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
