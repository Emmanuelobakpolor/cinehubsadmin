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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={onClose}
      aria-modal
      role="dialog"
    >
      <div
        className={"w-full max-w-4xl rounded-2xl bg-card shadow-2xl " + className}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
