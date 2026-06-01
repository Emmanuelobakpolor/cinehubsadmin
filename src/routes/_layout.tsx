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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onCollapsedChange={setCollapsed} />
      <main
        className={`main-content p-6 transition-all duration-300 ${collapsed ? "ml-[4.5rem]" : "ml-64"}`}
      >
        <Topbar />
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
