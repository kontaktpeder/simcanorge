import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  part_id: string;
  part_title: string;
}

const CART_KEY = "simca-inquiry-cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Lazy initialization - only runs once on mount
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Don't add duplicates
      if (prev.some((i) => i.part_id === item.part_id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((partId: string) => {
    setItems((prev) => prev.filter((i) => i.part_id !== partId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((partId: string) => {
    return items.some((i) => i.part_id === partId);
  }, [items]);

  return {
    items,
    itemCount: items.length,
    addItem,
    removeItem,
    clearCart,
    isInCart,
  };
}