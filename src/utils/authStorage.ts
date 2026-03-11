export type StoredTokens = {
  access?: string;
  refresh?: string;
};

const STORAGE_KEY = "accessToken";
const AUTH_STORAGE_EVENT = "auth-storage-changed";

const decodeBase64Url = (value: string): string | null => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;
  const padded =
    remainder === 0 ? normalized : `${normalized}${"=".repeat(4 - remainder)}`;

  try {
    return atob(padded);
  } catch {
    return null;
  }
};

const parseJwtExp = (token?: string): number | null => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const decoded = decodeBase64Url(parts[1]);
    if (!decoded) return null;
    const payload = JSON.parse(decoded) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token?: string): boolean => {
  const exp = parseJwtExp(token);
  if (!exp) return true;
  return exp <= Math.floor(Date.now() / 1000);
};

const readStorageToken = (storage: Storage): StoredTokens | null => {
  const rawValue = storage.getItem(STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as StoredTokens;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const access =
      typeof parsed.access === "string" && parsed.access.trim()
        ? parsed.access.trim()
        : undefined;
    const refresh =
      typeof parsed.refresh === "string" && parsed.refresh.trim()
        ? parsed.refresh.trim()
        : undefined;

    if (!access && !refresh) {
      return null;
    }

    return { access, refresh };
  } catch {
    return null;
  }
};

export const isJwtExpired = (token?: string): boolean => isTokenExpired(token);

export const getStoredAuthBundle = (): {
  tokens: StoredTokens | null;
  rememberMe: boolean;
} => {
  if (typeof window === "undefined") {
    return { tokens: null, rememberMe: false };
  }

  const sessionToken = readStorageToken(sessionStorage);
  const localToken = readStorageToken(localStorage);

  const hasValidAccess = (entry: StoredTokens | null) =>
    Boolean(entry?.access && !isTokenExpired(entry.access));
  const hasValidRefresh = (entry: StoredTokens | null) =>
    Boolean(entry?.refresh && !isTokenExpired(entry.refresh));

  if (hasValidAccess(sessionToken) || hasValidRefresh(sessionToken)) {
    return { tokens: sessionToken, rememberMe: false };
  }

  if (hasValidAccess(localToken) || hasValidRefresh(localToken)) {
    return { tokens: localToken, rememberMe: true };
  }

  if (sessionToken) {
    return { tokens: sessionToken, rememberMe: false };
  }

  if (localToken) {
    return { tokens: localToken, rememberMe: true };
  }

  return { tokens: null, rememberMe: false };
};

export const saveAuthTokens = (tokens: StoredTokens, rememberMe: boolean): void => {
  if (typeof window === "undefined") return;

  const target = rememberMe ? localStorage : sessionStorage;
  const fallback = rememberMe ? sessionStorage : localStorage;

  target.setItem(STORAGE_KEY, JSON.stringify(tokens));
  fallback.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
};

export const clearAuthTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
};

export const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const { tokens } = getStoredAuthBundle();

  return tokens?.access || null;
};

export const AUTH_STORAGE_CHANGED_EVENT = AUTH_STORAGE_EVENT;
