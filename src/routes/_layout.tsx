import { useState } from "react";
import { Outlet, createFileRoute, useRouterState, redirect } from "@tanstack/react-router";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
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
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      <Sidebar
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <main
        className={`main-content min-w-0 overflow-x-hidden transition-all duration-300 pb-16 md:pb-0 ${
          collapsed ? "md:ml-[4.5rem]" : "md:ml-64 xl:ml-72"
        }`}
      >
        <div className="mx-auto w-full min-w-0 max-w-[1800px] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 2xl:px-8">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <div key={pathname} className="page-enter min-w-0 overflow-x-hidden">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
