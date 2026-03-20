"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearCompareItems,
  COMPARE_STORAGE_EVENT,
  CompareEquipmentItem,
  hasCompareItem,
  readCompareItems,
  removeCompareItem,
  toggleCompareItem,
} from "./compareStorage";

export const useEquipmentCompare = () => {
  const [items, setItems] = useState<CompareEquipmentItem[]>([]);

  const syncItems = useCallback(() => {
    setItems(readCompareItems());
  }, []);

  useEffect(() => {
    syncItems();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "realab:equipment-compare") {
        return;
      }
      syncItems();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COMPARE_STORAGE_EVENT, syncItems);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COMPARE_STORAGE_EVENT, syncItems);
    };
  }, [syncItems]);

  const count = items.length;

  const toggleItem = useCallback((item: CompareEquipmentItem) => {
    const result = toggleCompareItem(item);
    setItems(result.items);
    return result.status;
  }, []);

  const removeItemById = useCallback((id: number) => {
    const nextItems = removeCompareItem(id);
    setItems(nextItems);
  }, []);

  const clearItems = useCallback(() => {
    clearCompareItems();
    setItems([]);
  }, []);

  const compareIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  return {
    items,
    count,
    compareIds,
    hasItem: hasCompareItem,
    toggleItem,
    removeItemById,
    clearItems,
  };
};

export type UseEquipmentCompareReturn = ReturnType<typeof useEquipmentCompare>;
