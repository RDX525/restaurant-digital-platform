"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import type { MenuItemWithModifiers } from "@/lib/menu/types";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { validateModifierSelection } from "@/lib/order/cart";
import type { CartModifier } from "@/lib/order/types";
import { useOrderCart } from "@/components/order/OrderCartProvider";
import { cn, formatPrice } from "@/lib/utils";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

interface AddToCartButtonProps {
  item: MenuItemWithModifiers;
  restaurant: PublicRestaurant;
  className?: string;
}

export function AddToCartButton({ item, restaurant, className }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity } = useOrderCart();
  const [open, setOpen] = useState(false);
  const requiresModifiers = item.modifier_groups.length > 0;

  const matchingLines = useMemo(
    () => items.filter((line) => line.menuItemId === item.id),
    [item.id, items],
  );
  const plainLine = matchingLines.find(
    (line) => line.modifiers.length === 0 && !line.specialInstructions,
  );
  const quantity = requiresModifiers
    ? matchingLines.reduce((sum, line) => sum + line.quantity, 0)
    : (plainLine?.quantity ?? 0);
  const stepperLine = requiresModifiers
    ? matchingLines[matchingLines.length - 1]
    : plainLine;

  function trackAdd(nextQuantity: number) {
    trackAnalyticsEvent({
      restaurantSlug: restaurant.slug,
      eventType: "ADD_TO_CART",
      menuItemId: item.id,
      metadata: { itemName: item.name, quantity: String(nextQuantity) },
    });
  }

  function handleQuickAdd() {
    trackAnalyticsEvent({
      restaurantSlug: restaurant.slug,
      eventType: "ITEM_VIEW",
      menuItemId: item.id,
      metadata: { itemName: item.name },
    });

    if (requiresModifiers) {
      setOpen(true);
      return;
    }

    addItem(item, 1, []);
    trackAdd(1);
  }

  function handleIncrease() {
    if (stepperLine) {
      updateQuantity(stepperLine.id, stepperLine.quantity + 1);
      trackAdd(stepperLine.quantity + 1);
      return;
    }

    if (requiresModifiers) {
      setOpen(true);
      return;
    }

    addItem(item, 1, []);
    trackAdd(1);
  }

  function handleDecrease() {
    if (!stepperLine) return;
    updateQuantity(stepperLine.id, stepperLine.quantity - 1);
  }

  return (
    <>
      {quantity > 0 ? (
        <QuantityStepper
          quantity={quantity}
          itemName={item.name}
          className={className}
          onDecrease={handleDecrease}
          onIncrease={handleIncrease}
        />
      ) : (
        <button
          type="button"
          onClick={handleQuickAdd}
          className={cn("btn-primary rounded-full", className)}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Add to order
        </button>
      )}

      {open ? (
        <ModifierModal
          item={item}
          onClose={() => setOpen(false)}
          onConfirm={(nextQuantity, modifiers, notes) => {
            addItem(item, nextQuantity, modifiers, notes);
            trackAdd(nextQuantity);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function QuantityStepper({
  quantity,
  itemName,
  className,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  itemName: string;
  className?: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center rounded-full bg-gradient-brand-btn text-white shadow-glow ring-1 ring-gold-500/20",
        className,
      )}
      role="group"
      aria-label={`${itemName} quantity`}
    >
      <button
        type="button"
        onClick={onDecrease}
        className="flex h-11 w-11 items-center justify-center rounded-full touch-manipulation hover:bg-white/10"
        aria-label={`Remove one ${itemName}`}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="flex h-11 w-11 items-center justify-center rounded-full touch-manipulation hover:bg-white/10"
        aria-label={`Add another ${itemName}`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function ModifierModal({
  item,
  onClose,
  onConfirm,
}: {
  item: MenuItemWithModifiers;
  onClose: () => void;
  onConfirm: (
    quantity: number,
    modifiers: CartModifier[],
    notes?: string,
  ) => void;
}) {
  const notesId = `item-notes-${item.id}`;
  const titleId = `modifier-modal-title-${item.id}`;
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    defaultRequiredSelections(item),
  );

  const selectedModifiers = useMemo(() => {
    const modifiers: CartModifier[] = [];

    for (const group of item.modifier_groups) {
      const ids = selected[group.id] ?? [];
      for (const modifierId of ids) {
        const modifier = group.modifiers.find((entry) => entry.id === modifierId);
        if (!modifier) continue;
        modifiers.push({
          id: modifier.id,
          groupId: group.id,
          groupName: group.name,
          name: modifier.name,
          price: modifier.price,
        });
      }
    }

    return modifiers;
  }, [item.modifier_groups, selected]);

  const lineTotal =
    (item.price + selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0)) *
    quantity;

  function toggleModifier(
    groupId: string,
    modifierId: string,
    maxSelections: number,
    required: boolean,
  ) {
    setSelected((current) => {
      const existing = current[groupId] ?? [];
      const isSelected = existing.includes(modifierId);

      if (maxSelections === 1) {
        if (isSelected && required) return current;
        return { ...current, [groupId]: isSelected ? [] : [modifierId] };
      }

      if (isSelected) {
        return {
          ...current,
          [groupId]: existing.filter((id) => id !== modifierId),
        };
      }

      if (maxSelections > 0 && existing.length >= maxSelections) {
        return current;
      }

      return { ...current, [groupId]: [...existing, modifierId] };
    });
  }

  function handleConfirm() {
    const validationError = validateModifierSelection(item, selectedModifiers);
    if (validationError) {
      setError(validationError);
      return;
    }

    onConfirm(quantity, selectedModifiers, notes);
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="platform-modal-backdrop z-[80]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="platform-modal max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-pine-900/5 bg-white px-5 py-4">
          <div>
            <p className="eyebrow">Customise</p>
            <h2 id={titleId} className="font-display text-2xl text-pine-900">
              {item.name}
            </h2>
            <p className="mt-1 text-sm text-pine-500">{formatPrice(item.price)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-pine-400 hover:bg-cream-100 hover:text-pine-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {item.modifier_groups.map((group) => (
            <div key={group.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-medium text-pine-900">{group.name}</h3>
                <span className="text-xs text-pine-500">
                  {group.is_required ? "Required" : "Optional"}
                </span>
              </div>
              <div className="space-y-2">
                {group.modifiers.map((modifier) => {
                  const checked = (selected[group.id] ?? []).includes(modifier.id);
                  return (
                    <label
                      key={modifier.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                        checked
                          ? "border-pine-700 bg-cream-50"
                          : "border-pine-900/10 hover:border-pine-900/20",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={group.max_selections === 1 ? "radio" : "checkbox"}
                          name={`${item.id}-${group.id}`}
                          value={modifier.id}
                          checked={checked}
                          onChange={() =>
                            toggleModifier(
                              group.id,
                              modifier.id,
                              group.max_selections,
                              group.is_required,
                            )
                          }
                          className="h-4 w-4 border-pine-300 text-pine-800 focus:ring-pine-500"
                        />
                        <span>{modifier.name}</span>
                      </span>
                      <span className="text-pine-500">
                        {modifier.price > 0 ? `+${formatPrice(modifier.price)}` : "Included"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <label htmlFor={notesId} className="label">
              Special instructions
            </label>
            <textarea
              id={notesId}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Any allergies or preferences?"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
            <span className="text-sm font-medium text-pine-700">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-pine-900/10 p-2 hover:bg-white"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                className="rounded-lg border border-pine-900/10 p-2 hover:bg-white"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error ? <div className="alert-error">{error}</div> : null}
        </div>

        <div className="sticky bottom-0 border-t border-pine-900/5 bg-white px-5 py-4">
          <button type="button" onClick={handleConfirm} className="btn-primary w-full py-3">
            Add {quantity} to order · {formatPrice(lineTotal)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function defaultRequiredSelections(item: MenuItemWithModifiers): Record<string, string[]> {
  const selected: Record<string, string[]> = {};
  for (const group of item.modifier_groups) {
    const firstOption = group.modifiers[0];
    if (group.is_required && group.min_selections >= 1 && firstOption) {
      selected[group.id] = [firstOption.id];
    }
  }
  return selected;
}
