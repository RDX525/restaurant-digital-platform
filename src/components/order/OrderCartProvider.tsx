"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
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
import {
  getCartLinesForMenuItem,
  getEmptyCartLines,
  setCartItemsSnapshot,
  subscribeCartItems,
} from "@/lib/order/cart-store";
import type { CartLineItem, CartModifier } from "@/lib/order/types";

interface OrderCartActions {
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

interface OrderCartContextValue extends OrderCartActions {
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
}

const OrderCartStateContext = createContext<OrderCartContextValue | null>(null);
const OrderCartActionsContext = createContext<OrderCartActions | null>(null);
const OrderCartCountContext = createContext(0);

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
  const [items, setItems] = useState<CartLineItem[]>([]);

  useEffect(() => {
    const next = loadInitialItems(restaurantSlug);
    setItems(next);
    setCartItemsSnapshot(next);
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
        setCartItemsSnapshot(nextItems);
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
    setCartItemsSnapshot([]);
  }, [restaurantSlug]);

  const { subtotal } = useMemo(
    () => calculateCartTotals(items, "pickup"),
    [items],
  );
  const itemCount = useMemo(() => countUniqueDishes(items), [items]);

  const actions = useMemo(
    () => ({
      addItem,
      updateQuantity,
      removeItem,
      clearAll,
    }),
    [addItem, updateQuantity, removeItem, clearAll],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      ...actions,
    }),
    [items, itemCount, subtotal, actions],
  );

  return (
    <OrderCartActionsContext.Provider value={actions}>
      <OrderCartCountContext.Provider value={itemCount}>
        <OrderCartStateContext.Provider value={value}>
          {children}
        </OrderCartStateContext.Provider>
      </OrderCartCountContext.Provider>
    </OrderCartActionsContext.Provider>
  );
}

export function useOrderCart() {
  const context = useContext(OrderCartStateContext);
  if (!context) {
    throw new Error("useOrderCart must be used within OrderCartProvider");
  }
  return context;
}

export function useOrderCartActions() {
  const context = useContext(OrderCartActionsContext);
  if (!context) {
    throw new Error("useOrderCartActions must be used within OrderCartProvider");
  }
  return context;
}

export function useOrderCartCount() {
  return useContext(OrderCartCountContext);
}

export function useCartLinesForMenuItem(menuItemId: string) {
  return useSyncExternalStore(
    subscribeCartItems,
    () => getCartLinesForMenuItem(menuItemId),
    getEmptyCartLines,
  );
}
