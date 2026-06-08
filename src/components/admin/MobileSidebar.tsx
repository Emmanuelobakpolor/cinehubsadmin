import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Package, Film, Tags, Users, Radio } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/upload-movie", label: "Upload", icon: Package },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/categories", label: "Tags", icon: Tags },
  { to: "/subscribers", label: "Users", icon: Users },
  { to: "/broadcast", label: "Live", icon: Radio },
] as const;

export function MobileSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-sidebar md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-[60px] w-full items-stretch">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-gold"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <span className="absolute -top-2.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-gold" />
                )}
                <Icon
                  className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`}
                />
              </div>
              <span className="text-[9px] font-medium leading-none tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
