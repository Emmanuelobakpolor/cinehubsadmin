export const API_BASE = "https://cinehubsbackend-production.up.railway.app/api";

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

// Access tokens expire after a day. Rather than letting every admin request
// fail with 401 (which shows up as empty/zero data), refresh the token once
// and retry. If the refresh token is also dead, send the admin to login.
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(rawFetch: typeof fetch): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh = getRefreshToken();
      if (!refresh) return null;
      try {
        const res = await rawFetch(`${API_BASE}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        storage?.setItem(KEYS.accessToken, data.access);
        if (data.refresh) storage?.setItem(KEYS.refreshToken, data.refresh);
        return data.access as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

if (typeof window !== "undefined" && !(window as any).__chAuthFetch) {
  (window as any).__chAuthFetch = true;
  const rawFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await rawFetch(input, init);
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = new Headers(init?.headers);
    if (res.status !== 401 || !url.startsWith(API_BASE) || !headers.has("Authorization")) {
      return res;
    }

    const token = await refreshAccessToken(rawFetch);
    if (!token) {
      clearAuth();
      if (window.location.pathname !== "/login") window.location.href = "/login";
      return res;
    }
    headers.set("Authorization", `Bearer ${token}`);
    return rawFetch(input, { ...init, headers });
  };
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
