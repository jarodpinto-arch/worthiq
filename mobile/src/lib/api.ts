/**
 * WorthIQ API client — shared across all mobile screens.
 * Reads the auth token from SecureStore (biometric-protected on device).
 */
import * as SecureStore from "expo-secure-store";

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.worthiq.io";

const TOKEN_KEY = "worthiq_auth_token";

// ── Token helpers ─────────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

type FetchOptions = RequestInit & { auth?: boolean };

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  const { auth = true, ...fetchOpts } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOpts.headers as Record<string, string>),
  };

  if (auth) {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOpts, headers });

  if (res.status === 401) {
    await clearToken();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access_token: string }>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  await saveToken(data.access_token);
  return data;
}

export async function getProfile() {
  return apiFetch<{ email: string; id: string }>("/auth/me");
}

export async function logout() {
  await clearToken();
}

// ── Financial data ────────────────────────────────────────────────────────────

export async function getAccounts() {
  return apiFetch<{ accounts: any[] }>("/plaid/accounts");
}

export async function getTransactions() {
  return apiFetch<{ transactions: any[] }>("/plaid/transactions");
}

export async function getInvestments() {
  return apiFetch<{ investmentTransactions: any[]; securities: any[] }>(
    "/plaid/investment-transactions"
  );
}

export async function askSage(message: string, context?: object) {
  return apiFetch<{ reply: string }>("/sage/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}
