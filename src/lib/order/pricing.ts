import type { FullMenu, MenuItemWithModifiers } from "@/lib/menu/types";
import { validateModifierSelection } from "@/lib/order/cart";
import { DELIVERY_FEE, GST_RATE } from "@/lib/order/constants";
import type { OrderLineItem, OrderLineItemInput, OrderTotals, OrderType } from "@/lib/order/types";

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildMenuItemMap(menu: FullMenu): Map<string, MenuItemWithModifiers> {
  const map = new Map<string, MenuItemWithModifiers>();
  for (const category of menu.categories) {
    for (const item of category.items) {
      map.set(item.id, item);
    }
  }
  return map;
}

export function priceOrderLines(
  menu: FullMenu,
  inputs: OrderLineItemInput[],
): OrderLineItem[] {
  const itemMap = buildMenuItemMap(menu);
  const lines: OrderLineItem[] = [];

  for (const input of inputs) {
    const menuItem = itemMap.get(input.menuItemId);
    if (!menuItem) {
      throw new OrderValidationError(`Menu item not found: ${input.menuItemId}`);
    }

    if (!menuItem.is_available || menuItem.is_sold_out) {
      throw new OrderValidationError(`${menuItem.name} is currently unavailable.`);
    }

    const selectedModifiers = [];
    const seenModifierIds = new Set<string>();

    for (const modifierId of input.modifierIds) {
      if (seenModifierIds.has(modifierId)) {
        throw new OrderValidationError(`Duplicate modifier selected for ${menuItem.name}.`);
      }
      seenModifierIds.add(modifierId);

      let found = false;
      for (const group of menuItem.modifier_groups) {
        const modifier = group.modifiers.find((entry) => entry.id === modifierId);
        if (modifier) {
          if (modifier.group_id !== group.id) {
            throw new OrderValidationError(`Invalid modifier reference for ${menuItem.name}.`);
          }
          selectedModifiers.push({
            id: modifier.id,
            groupId: group.id,
            groupName: group.name,
            name: modifier.name,
            price: Number(modifier.price),
          });
          found = true;
          break;
        }
      }

      if (!found) {
        throw new OrderValidationError(
          `Modifier does not belong to ${menuItem.name}.`,
        );
      }
    }

    const modifierError = validateModifierSelection(menuItem, selectedModifiers);
    if (modifierError) {
      throw new OrderValidationError(modifierError);
    }

    const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
    const unitPrice = Number(menuItem.price) + modifierTotal;
    const lineTotal = roundMoney(unitPrice * input.quantity);

    lines.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      basePrice: Number(menuItem.price),
      quantity: input.quantity,
      modifiers: selectedModifiers,
      specialInstructions: input.specialInstructions?.trim() || undefined,
      lineTotal,
    });
  }

  return lines;
}

export function calculateOrderTotals(
  lines: OrderLineItem[],
  orderType: OrderType,
  discountAmount = 0,
): OrderTotals {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const deliveryFee =
    orderType === "delivery" && subtotal > 0 ? roundMoney(DELIVERY_FEE) : 0;
  const discount = roundMoney(Math.max(0, discountAmount));
  const taxable = Math.max(0, subtotal + deliveryFee - discount);
  const taxAmount = roundMoney(taxable * GST_RATE);
  const total = roundMoney(taxable + taxAmount);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    subtotal,
    discountAmount: discount,
    deliveryFee,
    taxAmount,
    total,
    itemCount,
  };
}

export function validateOrderAgainstMenu(
  menu: FullMenu,
  restaurantId: string,
  inputs: OrderLineItemInput[],
): OrderLineItem[] {
  if (menu.restaurant_id !== restaurantId) {
    throw new OrderValidationError("Menu does not belong to this restaurant.");
  }

  if (!menu.is_active) {
    throw new OrderValidationError("This menu is not available for ordering.");
  }

  return priceOrderLines(menu, inputs);
}

export function toCartLineItems(lines: OrderLineItem[]): import("@/lib/order/types").CartLineItem[] {
  return lines.map((line, index) => ({
    id: `line-${line.menuItemId}-${index}`,
    ...line,
  }));
}
