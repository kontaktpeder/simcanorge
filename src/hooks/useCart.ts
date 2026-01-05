import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  part_id: string;
  part_title: string;
}

const CART_KEY = "simca-inquiry-cart";

// Helper to get initial cart from localStorage
function getInitialCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CART_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
      return [];
    }
  }
  return [];
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(getInitialCart);
  const [isInitialized, setIsInitialized] = useState(false);

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage only after initialization
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

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