import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { API_BASE, getAccessToken, getStoredUser, saveAuth, getRefreshToken } from "@/lib/auth";

export const Route = createFileRoute("/_layout/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const storedUser = getStoredUser();

  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleEmailSave() {
    setEmailError("");
    setEmailSuccess(false);
    if (!newEmail.trim()) return setEmailError("Please enter a new email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) return setEmailError("Please enter a valid email address.");

    setEmailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/admin/account/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Failed to update email.");
      } else {
        // Update stored email so topbar reflects the change
        const token = getAccessToken()!;
        const refresh = getRefreshToken()!;
        saveAuth({ access_token: token, refresh_token: refresh }, {
          email: data.email,
          full_name: storedUser?.full_name ?? "",
        });
        setEmailSuccess(true);
        setNewEmail("");
      }
    } catch {
      setEmailError("Could not connect to the server.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordSave() {
    setPasswordError("");
    setPasswordSuccess(false);
    if (!currentPassword) return setPasswordError("Current password is required.");
    if (!newPassword) return setPasswordError("New password is required.");
    if (newPassword.length < 6) return setPasswordError("New password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setPasswordError("Passwords do not match.");

    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/admin/account/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Could not connect to the server.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10">
          <Settings className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your admin account — currently signed in as{" "}
            <span className="font-medium text-foreground">{storedUser?.email ?? "—"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        {/* Change Email */}
        <div className="rounded-2xl bg-card px-4 py-5 shadow-sm sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-semibold">Change Email</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Current email</label>
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {storedUser?.email ?? "—"}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">New email address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); setEmailSuccess(false); }}
                placeholder="Enter new email"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>

            {emailError && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-xs text-destructive">
                {emailError}
              </p>
            )}

            {emailSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/8 px-3 py-2 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                Email updated successfully.
              </div>
            )}

            <button
              onClick={handleEmailSave}
              disabled={emailLoading}
              className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white transition-all hover:bg-gold/90 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {emailLoading ? (
                <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</>
              ) : (
                "Save Email"
              )}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl bg-card px-4 py-5 shadow-sm sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-semibold">Change Password</h2>
          </div>

          <div className="space-y-3">
            {/* Current password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium">Current password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium">New password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                placeholder="Repeat new password"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>

            {passwordError && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-xs text-destructive">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/8 px-3 py-2 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                Password updated successfully.
              </div>
            )}

            <button
              onClick={handlePasswordSave}
              disabled={passwordLoading}
              className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white transition-all hover:bg-gold/90 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</>
              ) : (
                "Save Password"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
