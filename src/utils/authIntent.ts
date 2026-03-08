import { getStoredAccessToken } from "./authStorage";
import { api } from "../redux/api";
import { store } from "../redux/store";

type PromoCategory = Array<{
  promo_category: string;
}>;

type FavoriteIntentPayload = {
  clothes: {
    promo_category: PromoCategory;
    clothes_name: string;
    price: number;
    size: string;
  };
  clothes_id: number;
};

type AuthIntent =
  | {
      type: "favorite:add";
      returnTo: string;
      payload: FavoriteIntentPayload;
    };

const AUTH_INTENT_KEY = "jumana:auth-intent";

const toSafePath = (path?: string | null): string =>
  path && path.startsWith("/") ? path : "/";

const getApiUrl = (path: string): string => {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};

export const buildSignInHref = (
  nextPath: string,
  fromPath?: string,
  intentType?: "favorite_add",
): string => {
  const safeNext = toSafePath(nextPath);
  const safeFrom = toSafePath(fromPath ?? nextPath);
  const params = new URLSearchParams();
  params.set("next", safeNext);
  params.set("from", safeFrom);
  if (intentType) {
    params.set("intent", intentType);
  }
  return `/auth/sign-in?${params.toString()}`;
};

export const saveAuthIntent = (intent: AuthIntent): void => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(intent));
};

export const clearAuthIntent = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(AUTH_INTENT_KEY);
};

export const readAuthIntent = (): AuthIntent | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(AUTH_INTENT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthIntent;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const queueFavoriteIntent = ({
  returnTo,
  clothes_id,
  clothes,
}: {
  returnTo?: string | null;
  clothes_id: number;
  clothes: FavoriteIntentPayload["clothes"];
}): string => {
  const safeReturnTo = toSafePath(returnTo);

  saveAuthIntent({
    type: "favorite:add",
    returnTo: safeReturnTo,
    payload: {
      clothes_id,
      clothes,
    },
  });

  return buildSignInHref(safeReturnTo, safeReturnTo, "favorite_add");
};

const resolveCurrentUserId = async (token: string): Promise<number | null> => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const profileResponses = await Promise.allSettled([
    fetch(getApiUrl("/profile/"), { method: "GET", headers }),
    fetch(getApiUrl("/profile"), { method: "GET", headers }),
  ]);

  for (const responseResult of profileResponses) {
    if (responseResult.status !== "fulfilled") {
      continue;
    }

    const response = responseResult.value;
    if (!response.ok) {
      continue;
    }

    try {
      const data = (await response.json()) as
        | { id?: number }
        | Array<{ id?: number }>;

      if (Array.isArray(data)) {
        const id = data[0]?.id;
        if (typeof id === "number") {
          return id;
        }
      } else if (typeof data?.id === "number") {
        return data.id;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const executeFavoriteIntent = async (
  token: string,
  intent: Extract<AuthIntent, { type: "favorite:add" }>,
): Promise<void> => {
  const userId = await resolveCurrentUserId(token);
  if (!userId) {
    return;
  }

  const response = await fetch(getApiUrl("/favorite_item/create/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...intent.payload,
      favorite_user: userId,
    }),
  });

  if (response.ok) {
    store.dispatch(api.util.invalidateTags(["category"]));
  }
};

export const executePendingAuthIntent = async (): Promise<string | null> => {
  const intent = readAuthIntent();
  if (!intent) {
    return null;
  }

  const returnTo = toSafePath(intent.returnTo);
  const token = getStoredAccessToken();

  try {
    if (!token) {
      return returnTo;
    }

    if (intent.type === "favorite:add") {
      await executeFavoriteIntent(token, intent);
    }
  } catch (error) {
    console.error("Pending auth intent failed:", error);
  } finally {
    clearAuthIntent();
  }

  return returnTo;
};
