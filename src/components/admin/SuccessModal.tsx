import { ImageIcon, BadgeCheck } from "lucide-react";

export function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-foreground/40 sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-sheet w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-5 text-center shadow-xl sm:p-8"
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center -mt-1 mb-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
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
