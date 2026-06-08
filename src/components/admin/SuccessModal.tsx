import { ImageIcon, BadgeCheck } from "lucide-react";

export function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-5 text-center shadow-xl sm:p-8"
      >
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-fuchsia-50 sm:h-24 sm:w-24">
          <div className="relative">
            <ImageIcon className="h-10 w-10 text-fuchsia-900 sm:h-12 sm:w-12" />
            <BadgeCheck className="absolute -right-2 -top-2 h-5 w-5 fill-fuchsia-500 text-white sm:h-6 sm:w-6" />
          </div>
        </div>
        <h3 className="mt-4 text-lg font-bold sm:mt-6 sm:text-xl">Movie Added Successful</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your movie has been listed to Cinehubs feed, all users can now browse and search for it.
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-fuchsia-500 py-3 text-sm font-semibold text-white hover:bg-fuchsia-600 sm:mt-6 sm:py-4"
        >
          Okay, noted
        </button>
      </div>
    </div>
  );
}
