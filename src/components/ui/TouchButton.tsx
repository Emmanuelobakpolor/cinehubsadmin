import React from "react";

export default function TouchButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-3 min-h-[40px] min-w-[40px] text-sm focus:outline-none focus:ring-2 focus:ring-gold " +
        className
      }
    >
      {children}
    </button>
  );
}
