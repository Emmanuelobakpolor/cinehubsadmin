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
        className={`main-content transition-all duration-300 ${
          collapsed ? "md:ml-[4.5rem]" : "md:ml-64 xl:ml-72"
        }`}
      >
        <div className="mx-auto w-full max-w-[1800px] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 2xl:px-8">
          <Topbar onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)} />
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
