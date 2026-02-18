import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  type: "part" | "listing";
  id: string;
  slug: string;
  title: string;
}

// Backward compat: migrate old cart format
function migrateOldCart(items: any[]): CartItem[] {
  return items.map((item) => {
    if (item.type && item.id && item.slug && item.title) return item as CartItem;
    // Old format: { part_id, part_title }
    if (item.part_id) {
      return {
        type: "part" as const,
        id: item.part_id,
        slug: item.part_id, // fallback – will work until slug is available
        title: item.part_title || "Ukjent del",
      };
    }
    return null;
  }).filter(Boolean) as CartItem[];
}

const CART_KEY = "simca-inquiry-cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        return migrateOldCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id && i.type === item.type)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((type: "part" | "listing", id: string) => {
    setItems((prev) => prev.filter((i) => !(i.type === type && i.id === id)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (type: "part" | "listing", id: string) => {
      return items.some((i) => i.type === type && i.id === id);
    },
    [items]
  );

  return {
    items,
    itemCount: items.length,
    addItem,
    removeItem,
    clearCart,
    isInCart,
  };
}
