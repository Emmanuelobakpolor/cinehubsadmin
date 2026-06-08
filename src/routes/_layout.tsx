import { useState, useEffect } from "react";
import { Outlet, createFileRoute, useRouterState, redirect } from "@tanstack/react-router";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { MobileSidebar } from "@/components/admin/MobileSidebar";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/_layout")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: LayoutShell,
});

function LayoutShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <Sidebar onCollapsedChange={setCollapsed} />
      <main
        className={`main-content transition-all duration-300 px-4 py-4 ${
          collapsed ? "md:ml-[4.5rem] md:p-6" : "md:ml-64 md:p-6"
        }`}
      >
        <Topbar onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)} />
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
