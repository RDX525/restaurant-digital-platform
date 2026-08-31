import type { CartLineItem } from "./types";

type Listener = () => void;

const listeners = new Set<Listener>();
const linesByItemCache = new Map<string, CartLineItem[]>();
const emptyLines: CartLineItem[] = [];

let cartItemsSnapshot: CartLineItem[] = [];

function linesEqual(a: CartLineItem[], b: CartLineItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every(
    (line, index) =>
      line.id === b[index]?.id &&
      line.quantity === b[index]?.quantity &&
      line.lineTotal === b[index]?.lineTotal,
  );
}

export function subscribeCartItems(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getEmptyCartLines(): CartLineItem[] {
  return emptyLines;
}

export function getCartItemsSnapshot(): CartLineItem[] {
  return cartItemsSnapshot;
}

export function setCartItemsSnapshot(items: CartLineItem[]): void {
  cartItemsSnapshot = items;
  listeners.forEach((listener) => listener());
}

export function getCartLinesForMenuItem(menuItemId: string): CartLineItem[] {
  const next = cartItemsSnapshot.filter((line) => line.menuItemId === menuItemId);
  const cached = linesByItemCache.get(menuItemId);
  if (cached && linesEqual(cached, next)) return cached;
  const result = next.length === 0 ? emptyLines : next;
  linesByItemCache.set(menuItemId, result);
  return result;
}

export function resetCartItemsSnapshot(): void {
  cartItemsSnapshot = [];
  linesByItemCache.clear();
  listeners.forEach((listener) => listener());
}
