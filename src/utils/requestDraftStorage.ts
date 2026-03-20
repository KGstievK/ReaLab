"use client";

export interface GuestRequestDraftItem {
  product_id?: number;
  quantity?: number;
  configuration_label?: string;
  color_label?: string;
  product_name?: string;
  image_url?: string;
  catalog_price?: number;
}

const REQUEST_DRAFT_KEY = "realab:guest-request-items";

const isBrowser = () => typeof window !== "undefined";

export const readGuestRequestItems = (): GuestRequestDraftItem[] => {
  if (!isBrowser()) {
    return [];
  }

  const raw = sessionStorage.getItem(REQUEST_DRAFT_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as GuestRequestDraftItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeGuestRequestItems = (items: GuestRequestDraftItem[]): void => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(items));
};

export const clearGuestRequestItems = (): void => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(REQUEST_DRAFT_KEY);
};
