import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ToolboxAddModal } from "@/components/markedsplass/ToolboxAddModal";

export interface CartItem {
  type: "part" | "listing";
  id: string;
  slug: string;
  title: string;
}

const CART_KEY = "simca-inquiry-cart";

function migrateOldCart(items: any[]): CartItem[] {
  return items
    .map((item) => {
      if (item.type && item.id && item.slug && item.title) return item as CartItem;
      if (item.part_id) {
        return {
          type: "part" as const,
          id: item.part_id,
          slug: item.part_id,
          title: item.part_title || "Ukjent del",
        };
      }
      return null;
    })
    .filter(Boolean) as CartItem[];
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (type: "part" | "listing", id: string) => void;
  clearCart: () => void;
  isInCart: (type: "part" | "listing", id: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) return migrateOldCart(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to parse cart", e);
    }
    return [];
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [lastAddedTitle, setLastAddedTitle] = useState<string | undefined>();

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    let wasAdded = false;
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id && i.type === item.type)) return prev;
      wasAdded = true;
      return [...prev, item];
    });
    // Show modal even if already in cart (for feedback)
    setLastAddedTitle(item.title);
    setModalOpen(true);
  }, []);

  const removeItem = useCallback((type: "part" | "listing", id: string) => {
    setItems((prev) => prev.filter((i) => !(i.type === type && i.id === id)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (type: "part" | "listing", id: string) =>
      items.some((i) => i.type === type && i.id === id),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.length,
        addItem,
        removeItem,
        clearCart,
        isInCart,
      }}
    >
      {children}
      <ToolboxAddModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        addedItemTitle={lastAddedTitle}
        itemCount={items.length}
      />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
