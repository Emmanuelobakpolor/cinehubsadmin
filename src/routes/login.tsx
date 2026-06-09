import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import logo from "@/assets/logo.png";
import { API_BASE, isAuthenticated, saveAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/admin-login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? data.non_field_errors?.[0] ?? "Invalid email or password.");
        return;
      }
      saveAuth({ access_token: data.access_token, refresh_token: data.refresh_token }, data.user);
      router.navigate({ to: "/dashboard" });
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col items-center justify-center px-16 relative overflow-hidden"
        style={{ background: "var(--sidebar)" }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ background: "oklch(0.78 0.14 80 / 0.12)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "oklch(0.78 0.14 80 / 0.07)" }}
        />

        <div className="relative z-10 text-center" style={{ color: "var(--sidebar-foreground)" }}>
          <img src={logo} alt="Cinehubs" className="mx-auto h-20 w-20 mb-8" />
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Cinehubs{" "}
            <span style={{ color: "var(--gold)" }}>Admin</span>
          </h1>
          <p
            className="text-lg leading-relaxed max-w-xs mx-auto"
            style={{ color: "oklch(0.95 0.005 250 / 0.55)" }}
          >
            Manage your movie streaming platform from one powerful dashboard.
          </p>

          <div className="mt-12 space-y-4 text-left w-fit mx-auto">
            {[
              "Manage movies & subscriptions",
              "Broadcast to all subscribers",
              "Track users & analytics",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: "oklch(0.78 0.14 80 / 0.15)",
                    color: "var(--gold)",
                  }}
                >
                  ✓
                </span>
                <span className="text-sm" style={{ color: "oklch(0.95 0.005 250 / 0.65)" }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex flex-1 items-center justify-center p-4 sm:p-8"
        style={{ background: "var(--background)" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Cinehubs" className="h-14 w-14" />
          </div>

          <div className="mb-8">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--gold)" }}
            >
              Admin Portal
            </p>
            <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Welcome back
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Sign in to your admin account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cinehubs.com"
                  autoComplete="email"
                  className="w-full rounded-xl border py-3 sm:py-3.5 pl-10 sm:pl-11 pr-3 sm:pr-4 text-sm outline-none transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--card)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border py-3 sm:py-3.5 pl-10 sm:pl-11 pr-11 sm:pr-12 text-sm outline-none transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--card)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--foreground)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "oklch(0.6 0.22 25 / 0.25)",
                  background: "oklch(0.6 0.22 25 / 0.08)",
                  color: "var(--destructive)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 sm:py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: "var(--gold)",
                color: "var(--foreground)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
            Use your registered admin account to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
