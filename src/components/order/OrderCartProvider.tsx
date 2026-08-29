"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MenuItemWithModifiers } from "@/lib/menu/types";
import {
  buildCartLineItem,
  calculateCartTotals,
  calculateLineTotal,
  clearCart,
  mergeItemIntoCart,
  countUniqueDishes,
  readCart,
  writeCart,
} from "@/lib/order/cart";
import type { CartLineItem, CartModifier } from "@/lib/order/types";

interface OrderCartContextValue {
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  addItem: (
    item: MenuItemWithModifiers,
    quantity: number,
    modifiers: CartModifier[],
    specialInstructions?: string,
  ) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearAll: () => void;
}

const OrderCartContext = createContext<OrderCartContextValue | null>(null);

function loadInitialItems(restaurantSlug: string): CartLineItem[] {
  if (typeof window === "undefined") return [];
  return readCart(restaurantSlug).items;
}

export function OrderCartProvider({
  restaurantSlug,
  children,
}: {
  restaurantSlug: string;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartLineItem[]>(() => loadInitialItems(restaurantSlug));

  useEffect(() => {
    setItems(loadInitialItems(restaurantSlug));
  }, [restaurantSlug]);

  const persist = useCallback(
    (updater: CartLineItem[] | ((current: CartLineItem[]) => CartLineItem[])) => {
      setItems((current) => {
        const nextItems = typeof updater === "function" ? updater(current) : updater;
        writeCart({
          restaurantSlug,
          items: nextItems,
          updatedAt: new Date().toISOString(),
        });
        return nextItems;
      });
    },
    [restaurantSlug],
  );

  const addItem = useCallback(
    (
      item: MenuItemWithModifiers,
      quantity: number,
      modifiers: CartModifier[],
      specialInstructions?: string,
    ) => {
      const lineItem = buildCartLineItem(item, quantity, modifiers, specialInstructions);
      persist((current) => mergeItemIntoCart(current, lineItem));
    },
    [persist],
  );

  const updateQuantity = useCallback(
    (lineId: string, quantity: number) => {
      if (quantity <= 0) {
        persist((current) => current.filter((item) => item.id !== lineId));
        return;
      }

      persist((current) =>
        current.map((item) =>
          item.id === lineId
            ? {
                ...item,
                quantity,
                lineTotal: calculateLineTotal(item.basePrice, item.modifiers, quantity),
              }
            : item,
        ),
      );
    },
    [persist],
  );

  const removeItem = useCallback(
    (lineId: string) => {
      persist((current) => current.filter((item) => item.id !== lineId));
    },
    [persist],
  );

  const clearAll = useCallback(() => {
    clearCart(restaurantSlug);
    setItems([]);
  }, [restaurantSlug]);

  const { subtotal } = useMemo(
    () => calculateCartTotals(items, "pickup"),
    [items],
  );
  const itemCount = useMemo(() => countUniqueDishes(items), [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearAll,
    }),
    [items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearAll],
  );

  return (
    <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>
  );
}

export function useOrderCart() {
  const context = useContext(OrderCartContext);
  if (!context) {
    throw new Error("useOrderCart must be used within OrderCartProvider");
  }
  return context;
}
