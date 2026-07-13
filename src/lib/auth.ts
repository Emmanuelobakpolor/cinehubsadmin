export const API_BASE = "https://web-production-3fa8c.up.railway.app/api";

const KEYS = {
  accessToken: "ch_access_token",
  refreshToken: "ch_refresh_token",
  email: "ch_admin_email",
  fullName: "ch_admin_name",
};

export interface AdminUser {
  email: string;
  full_name: string;
}

const storage = typeof window !== "undefined" ? window.localStorage : null;

export function saveAuth(tokens: { access_token: string; refresh_token: string }, user: AdminUser) {
  storage?.setItem(KEYS.accessToken, tokens.access_token);
  storage?.setItem(KEYS.refreshToken, tokens.refresh_token);
  storage?.setItem(KEYS.email, user.email);
  storage?.setItem(KEYS.fullName, user.full_name);
}

export function getStoredUser(): AdminUser | null {
  const email = storage?.getItem(KEYS.email) ?? null;
  const full_name = storage?.getItem(KEYS.fullName) ?? null;
  if (!email) return null;
  return { email, full_name: full_name ?? email };
}

export function getAccessToken(): string | null {
  return storage?.getItem(KEYS.accessToken) ?? null;
}

export function getRefreshToken(): string | null {
  return storage?.getItem(KEYS.refreshToken) ?? null;
}

export function isAuthenticated(): boolean {
  return !!storage?.getItem(KEYS.accessToken);
}

export function clearAuth() {
  Object.values(KEYS).forEach((k) => storage?.removeItem(k));
}

export async function logoutAndRedirect(navigate: (opts: { to: string }) => void) {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (accessToken && refreshToken) {
    try {
      await fetch(`${API_BASE}/users/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // proceed with local logout even if API call fails
    }
  }
  clearAuth();
  navigate({ to: "/login" });
}
