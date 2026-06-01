import { ImageIcon, BadgeCheck } from "lucide-react";

export function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-xl"
      >
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-fuchsia-50">
          <div className="relative">
            <ImageIcon className="h-12 w-12 text-fuchsia-900" />
            <BadgeCheck className="absolute -right-2 -top-2 h-6 w-6 fill-fuchsia-500 text-white" />
          </div>
        </div>
        <h3 className="mt-6 text-xl font-bold">Movie Added Successful</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your movie has been listed to Cinehubs feed, all user can now browse and search for it .
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-fuchsia-500 py-4 text-sm font-semibold text-white hover:bg-fuchsia-600"
        >
          Okay, noted
        </button>
      </div>
    </div>
  );
}
