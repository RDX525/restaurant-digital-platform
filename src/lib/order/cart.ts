import type { CartLineItem } from "./types";
import { calculateOrderTotals } from "./pricing";

export const DELIVERY_FEE = 5.5;

export function cartStorageKey(slug: string, scope = "web"): string {
  return scope === "web" ? `kati-cart:${slug}` : `kati-cart:${slug}:${scope}`;
}

export function idempotencyStorageKey(slug: string, scope = "web"): string {
  return scope === "web"
    ? `kati-idempotency:${slug}`
    : `kati-idempotency:${slug}:${scope}`;
}

export function dineInCartScope(tableId: string, sessionId: string): string {
  return `table:${tableId}:session:${sessionId}`;
}

export function createLineItemId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getOrCreateIdempotencyKey(
  restaurantSlug: string,
  scope = "web",
): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const key = idempotencyStorageKey(restaurantSlug, scope);
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.sessionStorage.setItem(key, value);
  return value;
}

export function clearIdempotencyKey(restaurantSlug: string, scope = "web"): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(idempotencyStorageKey(restaurantSlug, scope));
}

export function calculateLineTotal(
  basePrice: number,
  modifiers: { price: number }[],
  quantity: number,
): number {
  const modifierTotal = modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  return (basePrice + modifierTotal) * quantity;
}

export function calculateCartTotals(
  items: CartLineItem[],
  orderType: "pickup" | "delivery" | "dine_in",
) {
  const lines = items.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    basePrice: item.basePrice,
    quantity: item.quantity,
    modifiers: item.modifiers,
    specialInstructions: item.specialInstructions,
    lineTotal: item.lineTotal,
  }));

  return calculateOrderTotals(lines, orderType);
}

export function buildCartLineItem(
  item: import("@/lib/menu/types").MenuItemWithModifiers,
  quantity: number,
  modifiers: import("./types").CartModifier[],
  specialInstructions?: string,
): CartLineItem {
  return {
    id: createLineItemId(),
    menuItemId: item.id,
    name: item.name,
    basePrice: item.price,
    quantity,
    modifiers,
    specialInstructions: specialInstructions?.trim() || undefined,
    lineTotal: calculateLineTotal(item.price, modifiers, quantity),
  };
}

export function cartLineMatchKey(
  line: Pick<CartLineItem, "menuItemId" | "modifiers" | "specialInstructions">,
): string {
  const modifierIds = line.modifiers
    .map((modifier) => modifier.id)
    .sort()
    .join(",");
  return `${line.menuItemId}|${modifierIds}|${line.specialInstructions?.trim() ?? ""}`;
}

export function mergeItemIntoCart(
  items: CartLineItem[],
  next: CartLineItem,
): CartLineItem[] {
  const key = cartLineMatchKey(next);
  const index = items.findIndex((item) => cartLineMatchKey(item) === key);
  if (index === -1) return [...items, next];

  const existing = items[index];
  const quantity = existing.quantity + next.quantity;
  const updated: CartLineItem = {
    ...existing,
    quantity,
    lineTotal: calculateLineTotal(existing.basePrice, existing.modifiers, quantity),
  };

  return items.map((item, itemIndex) => (itemIndex === index ? updated : item));
}

export function countUniqueDishes(
  items: Pick<CartLineItem, "menuItemId">[],
): number {
  return new Set(items.map((item) => item.menuItemId)).size;
}

export function validateModifierSelection(
  item: import("@/lib/menu/types").MenuItemWithModifiers,
  selected: import("./types").CartModifier[],
): string | null {
  for (const group of item.modifier_groups) {
    const groupSelections = selected.filter((modifier) => modifier.groupId === group.id);

    if (group.is_required && groupSelections.length === 0) {
      return `Please choose an option for ${group.name}.`;
    }

    if (groupSelections.length < group.min_selections) {
      return `Choose at least ${group.min_selections} option(s) for ${group.name}.`;
    }

    if (group.max_selections > 0 && groupSelections.length > group.max_selections) {
      return `Choose at most ${group.max_selections} option(s) for ${group.name}.`;
    }
  }

  return null;
}

export function readCart(
  slug: string,
  scope = "web",
): import("./types").CartState {
  if (typeof window === "undefined") {
    return { restaurantSlug: slug, items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const raw = window.localStorage.getItem(cartStorageKey(slug, scope));
    if (!raw) {
      return { restaurantSlug: slug, items: [], updatedAt: new Date().toISOString() };
    }

    const parsed = JSON.parse(raw) as import("./types").CartState;
    if (parsed.restaurantSlug !== slug || !Array.isArray(parsed.items)) {
      return { restaurantSlug: slug, items: [], updatedAt: new Date().toISOString() };
    }

    return parsed;
  } catch {
    return { restaurantSlug: slug, items: [], updatedAt: new Date().toISOString() };
  }
}

export function writeCart(cart: import("./types").CartState, scope = "web"): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    cartStorageKey(cart.restaurantSlug, scope),
    JSON.stringify(cart),
  );
}

export function clearCart(slug: string, scope = "web"): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(cartStorageKey(slug, scope));
}
