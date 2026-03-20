"use client";

export interface CompareEquipmentItem {
  id: number;
  href: string;
  name: string;
  categoryName: string;
  imageUrl: string;
  price: number;
  discountPrice: number;
  defaultSize: string;
  defaultColorId: number | null;
  defaultColorLabel: string;
  availabilityLabel: string;
}

export const COMPARE_STORAGE_KEY = "realab:equipment-compare";
export const COMPARE_STORAGE_EVENT = "realab:equipment-compare-change";
export const MAX_COMPARE_ITEMS = 4;

const isBrowser = () => typeof window !== "undefined";

const sanitizeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCompareItem = (item: CompareEquipmentItem): CompareEquipmentItem => ({
  id: item.id,
  href: item.href || "/",
  name: item.name || "Оборудование ReaLab",
  categoryName: item.categoryName || "Каталог",
  imageUrl: item.imageUrl || "",
  price: sanitizeNumber(item.price),
  discountPrice: sanitizeNumber(item.discountPrice),
  defaultSize: item.defaultSize || "Base",
  defaultColorId: item.defaultColorId ?? null,
  defaultColorLabel: item.defaultColorLabel || "Стандартный финиш",
  availabilityLabel: item.availabilityLabel || "Под заказ",
});

const emitCompareChange = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(COMPARE_STORAGE_EVENT));
};

export const readCompareItems = (): CompareEquipmentItem[] => {
  if (!isBrowser()) {
    return [];
  }

  const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CompareEquipmentItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => Number.isFinite(Number(item?.id)))
      .map((item) => normalizeCompareItem(item))
      .slice(0, MAX_COMPARE_ITEMS);
  } catch {
    return [];
  }
};

export const writeCompareItems = (items: CompareEquipmentItem[]): void => {
  if (!isBrowser()) {
    return;
  }

  const normalized = items
    .map((item) => normalizeCompareItem(item))
    .filter((item, index, array) => array.findIndex((entry) => entry.id === item.id) === index)
    .slice(0, MAX_COMPARE_ITEMS);

  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(normalized));
  emitCompareChange();
};

export const removeCompareItem = (id: number): CompareEquipmentItem[] => {
  const nextItems = readCompareItems().filter((item) => item.id !== id);
  writeCompareItems(nextItems);
  return nextItems;
};

export const clearCompareItems = (): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(COMPARE_STORAGE_KEY);
  emitCompareChange();
};

export const hasCompareItem = (id: number): boolean =>
  readCompareItems().some((item) => item.id === id);

export const toggleCompareItem = (
  item: CompareEquipmentItem,
): { status: "added" | "removed" | "full"; items: CompareEquipmentItem[] } => {
  const currentItems = readCompareItems();
  const exists = currentItems.some((entry) => entry.id === item.id);

  if (exists) {
    const nextItems = currentItems.filter((entry) => entry.id !== item.id);
    writeCompareItems(nextItems);
    return {
      status: "removed",
      items: nextItems,
    };
  }

  if (currentItems.length >= MAX_COMPARE_ITEMS) {
    return {
      status: "full",
      items: currentItems,
    };
  }

  const nextItems = [...currentItems, normalizeCompareItem(item)];
  writeCompareItems(nextItems);

  return {
    status: "added",
    items: nextItems,
  };
};
