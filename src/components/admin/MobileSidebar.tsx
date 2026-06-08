import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { LayoutGrid, Package, Film, Tags, Users, Radio, ChevronLeft, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { logoutAndRedirect } from "@/lib/auth";
import { useEffect } from "react";

const navGroups = [
  {
    label: "MAIN",
    items: [{ to: "/", label: "Dashboard", icon: LayoutGrid }],
  },
  {
    label: "CONTENT",
    items: [
      { to: "/upload-movie", label: "Upload Movie", icon: Package },
      { to: "/movies", label: "Movies", icon: Film },
      { to: "/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "COMMUNICATE",
    items: [
      { to: "/subscribers", label: "Subscribers", icon: Users },
      { to: "/broadcast", label: "Broadcast", icon: Radio },
    ],
  },
] as const;

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const handleLogout = () => logoutAndRedirect(router.navigate);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-sidebar transform transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-center border-b border-white/10">
          <img src={logo} alt="Cinehubs" className="h-11 w-11" />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 min-h-0">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-2 text-xs font-semibold tracking-[0.5px] text-sidebar-foreground/40 uppercase">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const isActive = pathname === to;

                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-gold/10 to-transparent text-gold"
                          : "text-sidebar-foreground/80 hover:bg-white/5"
                      }`}
                      onClick={onClose}
                    >
                      <Icon
                        className={`h-5 w-5 ${isActive ? "scale-110" : ""}`}
                      />
                      <span className="whitespace-nowrap">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-white/5 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">Log out</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute -right-10 top-20 grid h-8 w-8 items-center justify-center rounded-r-lg border border-gold/30 bg-sidebar text-gold"
          aria-label="Close menu"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      </aside>
    </>
  );
}
