import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Gem } from "lucide-react";
import { API_BASE, getAccessToken } from "@/lib/auth";

interface Plan {
  id: number;
  name: string;
  price: string;
  description: string;
}

export function SubscriptionPricingModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: Plan;
  onClose: () => void;
  onSaved: (updated: Plan) => void;
}) {
  const [price, setPrice] = useState(plan.price);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/subscriptions/plans/${plan.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ price }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || data?.price?.[0] || "Failed to update price.");
      }
      const updated: Plan = await res.json();
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Subscription Pricing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the price for the {plan.name} plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid place-items-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gold/10">
            <Gem className="h-9 w-9 text-gold" />
          </div>
          <div className="mt-3 text-lg font-bold text-gold">{plan.name}</div>
        </div>

        <div className="mt-6 rounded-2xl bg-secondary p-5">
          <div className="font-semibold">Set {plan.name} Plan Price</div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">₦</span>
            <input
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="Enter price"
            />
            <span className="text-sm text-muted-foreground">/ movie</span>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-gold py-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Saving…" : "Set Price"}
        </button>
      </div>
    </div>,
    document.body
  );
}
