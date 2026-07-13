import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export default function BaseModal({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 sm:p-4"
      onMouseDown={onClose}
      aria-modal
      role="dialog"
    >
      <div
        className={"modal-sheet w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl overflow-y-auto " + className}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxHeight: "calc(100vh - 3rem)" }}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
