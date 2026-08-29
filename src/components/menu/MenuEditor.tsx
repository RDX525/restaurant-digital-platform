"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, Save, Trash2 } from "lucide-react";
import { SortableList } from "@/components/ui/SortableList";
import { ImageUpload } from "@/components/menu/ImageUpload";
import { MenuPreview } from "@/components/menu/MenuPreview";
import { useMenu } from "@/hooks/useMenu";
import {
  createCategory,
  createItem,
  createMenu,
  createModifier,
  createModifierGroup,
  deleteCategory,
  deleteItem,
  deleteMenu,
  deleteModifier,
  deleteModifierGroup,
  reorderRows,
  saveMenu,
  updateCategory,
  updateItem,
  updateModifier,
  updateModifierGroup,
} from "@/lib/menu/client-api";
import type {
  MenuCategoryWithItems,
  MenuItemWithModifiers,
} from "@/lib/menu/types";
import { formatPrice, getErrorMessage, joinCommaList, parseCommaList } from "@/lib/utils";

interface MenuEditorProps {
  menuId: string;
}

export function MenuEditor({ menuId }: MenuEditorProps) {
  const router = useRouter();
  const { menu, loading, error, reload, setMenu } = useMenu(menuId);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (menu) {
      setMenuForm({ name: menu.name, description: menu.description ?? "" });
    }
  }, [menu]);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setActionError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  async function handleSaveMenu() {
    await runAction(async () => {
      await saveMenu(menuId, {
        name: menuForm.name,
        description: menuForm.description || null,
      });
    }, "Menu saved");
  }

  async function handleToggleActive() {
    if (!menu) return;
    await runAction(async () => {
      await saveMenu(menuId, { is_active: !menu.is_active });
    }, menu.is_active ? "Menu deactivated" : "Menu activated");
  }

  async function handleDeleteMenu() {
    if (!confirm("Delete this menu and all of its contents?")) return;
    await runAction(async () => {
      await deleteMenu(menuId);
      router.push("/dashboard/menus");
      router.refresh();
    }, "Menu deleted");
  }

  async function handleAddCategory() {
    const name = prompt("Category name");
    if (!name?.trim()) return;
    const sortOrder = menu?.categories.length ?? 0;
    await runAction(async () => {
      await createCategory(menuId, name.trim(), sortOrder);
    }, "Category created");
  }

  async function handleReorderCategories(categories: MenuCategoryWithItems[]) {
    const rows = categories.map((category, index) => ({
      id: category.id,
      sort_order: index,
    }));
    await runAction(async () => {
      await reorderRows(`/api/menus/${menuId}/categories`, rows);
    }, "Categories reordered");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-72" />
      </div>
    );
  }

  if (error || !menu) {
    return <div className="alert-error">{error ?? "Menu not found"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Menu editor</p>
          <h1 className="mt-1 font-display text-3xl text-pine-900">{menu.name}</h1>
          <div className="mt-2">
            {menu.is_active ? (
              <span className="badge-live">Live</span>
            ) : (
              <span className="badge-muted">Draft</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => setShowPreview((v) => !v)}>
            <Eye className="h-4 w-4" />
            {showPreview ? "Hide preview" : "Preview menu"}
          </button>
          <button type="button" className="btn-secondary" onClick={handleToggleActive}>
            {menu.is_active ? "Deactivate" : "Activate"}
          </button>
          <button type="button" className="btn-danger" onClick={handleDeleteMenu}>
            <Trash2 className="h-4 w-4" />
            Delete menu
          </button>
        </div>
      </div>

      {message ? <div className="alert-success">{message}</div> : null}
      {actionError ? <div className="alert-error">{actionError}</div> : null}

      <div className="settings-section">
        <div className="settings-section-header">
          <h2 className="font-display text-xl text-pine-900">Menu details</h2>
        </div>
        <div className="settings-section-body">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="menu-name">
              Name
            </label>
            <input
              id="menu-name"
              className="input"
              value={menuForm.name}
              onChange={(event) =>
                setMenuForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="menu-description">
              Description
            </label>
            <input
              id="menu-description"
              className="input"
              value={menuForm.description}
              onChange={(event) =>
                setMenuForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <button type="button" className="btn-primary" onClick={handleSaveMenu}>
          <Save className="h-4 w-4" />
          Save changes
        </button>
        </div>
      </div>

      {showPreview ? <MenuPreview menu={menu} /> : null}

      <div className="settings-section">
        <div className="settings-section-header flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-pine-900">Categories</h2>
          <button type="button" className="btn-secondary" onClick={handleAddCategory}>
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </div>
        <div className="settings-section-body">
        <SortableList
          items={menu.categories}
          onReorder={(categories) => {
            setMenu({ ...menu, categories });
            void handleReorderCategories(categories);
          }}
          renderItem={(category) => (
            <CategoryEditor
              category={category}
              onChange={reload}
              onError={setActionError}
              onMessage={setMessage}
            />
          )}
        />
        </div>
      </div>
    </div>
  );
}

function CategoryEditor({
  category,
  onChange,
  onError,
  onMessage,
}: {
  category: MenuCategoryWithItems;
  onChange: () => Promise<void>;
  onError: (value: string) => void;
  onMessage: (value: string) => void;
}) {
  const [name, setName] = useState(category.name);

  async function run(action: () => Promise<unknown>, success: string) {
    onError("");
    onMessage("");
    try {
      await action();
      onMessage(success);
      await onChange();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            run(
              () => updateCategory(category.id, { name: name.trim() }),
              "Category updated",
            )
          }
        >
          Save
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            run(
              () => updateCategory(category.id, { is_active: !category.is_active }),
              category.is_active ? "Category hidden" : "Category shown",
            )
          }
        >
          {category.is_active ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            if (!confirm("Delete this category and all items?")) return;
            void run(() => deleteCategory(category.id), "Category deleted");
          }}
        >
          Delete
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const itemName = prompt("Item name");
            if (!itemName?.trim()) return;
            void run(
              () =>
                createItem(category.id, {
                  name: itemName.trim(),
                  price: 0,
                  description: "",
                  ingredients: [],
                  allergens: [],
                  dietary_info: [],
                  sort_order: category.items.length,
                }),
              "Item created",
            );
          }}
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      <SortableList
        items={category.items}
        onReorder={(items) => {
          void run(async () => {
            const rows = items.map((item, index) => ({
              id: item.id,
              sort_order: index,
            }));
            await reorderRows(`/api/categories/${category.id}/items`, rows);
          }, "Items reordered");
        }}
        renderItem={(item) => (
          <ItemEditor item={item} onChange={onChange} onError={onError} onMessage={onMessage} />
        )}
      />
    </div>
  );
}

function ItemEditor({
  item,
  onChange,
  onError,
  onMessage,
}: {
  item: MenuItemWithModifiers;
  onChange: () => Promise<void>;
  onError: (value: string) => void;
  onMessage: (value: string) => void;
}) {
  const [form, setForm] = useState({
    name: item.name,
    description: item.description ?? "",
    price: String(item.price),
    ingredients: joinCommaList(item.ingredients),
    allergens: joinCommaList(item.allergens),
    dietary_info: joinCommaList(item.dietary_info),
  });

  async function run(action: () => Promise<unknown>, success: string) {
    onError("");
    onMessage("");
    try {
      await action();
      onMessage(success);
      await onChange();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-pine-500">{formatPrice(item.price)}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="input"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <input
          className="input"
          placeholder="Price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
        />
        <input
          className="input md:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
        />
        <input
          className="input"
          placeholder="Ingredients (comma separated)"
          value={form.ingredients}
          onChange={(event) =>
            setForm((current) => ({ ...current, ingredients: event.target.value }))
          }
        />
        <input
          className="input"
          placeholder="Allergens (comma separated)"
          value={form.allergens}
          onChange={(event) =>
            setForm((current) => ({ ...current, allergens: event.target.value }))
          }
        />
        <input
          className="input md:col-span-2"
          placeholder="Dietary info (comma separated)"
          value={form.dietary_info}
          onChange={(event) =>
            setForm((current) => ({ ...current, dietary_info: event.target.value }))
          }
        />
      </div>

      <ImageUpload
        itemId={item.id}
        photoUrl={item.photo_url}
        onUploaded={() => void onChange()}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            run(
              () =>
                updateItem(item.id, {
                  name: form.name.trim(),
                  description: form.description || null,
                  price: Number(form.price),
                  ingredients: parseCommaList(form.ingredients),
                  allergens: parseCommaList(form.allergens),
                  dietary_info: parseCommaList(form.dietary_info),
                }),
              "Item saved",
            )
          }
        >
          Save item
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            run(
              () => updateItem(item.id, { is_available: !item.is_available }),
              item.is_available ? "Marked unavailable" : "Marked available",
            )
          }
        >
          {item.is_available ? "Mark unavailable" : "Mark available"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            run(
              () => updateItem(item.id, { is_sold_out: !item.is_sold_out }),
              item.is_sold_out ? "Marked in stock" : "Marked sold out",
            )
          }
        >
          {item.is_sold_out ? "Mark in stock" : "Mark sold out"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            run(
              () => updateItem(item.id, { is_popular: !item.is_popular }),
              "Popular flag updated",
            )
          }
        >
          {item.is_popular ? "Unmark popular" : "Mark popular"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            run(
              () => updateItem(item.id, { is_recommended: !item.is_recommended }),
              "Recommended flag updated",
            )
          }
        >
          {item.is_recommended ? "Unmark recommended" : "Mark recommended"}
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            if (!confirm("Delete this item?")) return;
            void run(() => deleteItem(item.id), "Item deleted");
          }}
        >
          Delete item
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const groupName = prompt("Modifier group name (e.g. Toppings)");
            if (!groupName?.trim()) return;
            void run(
              () =>
                createModifierGroup(item.id, {
                  name: groupName.trim(),
                  is_required: false,
                  min_selections: 0,
                  max_selections: 3,
                  sort_order: item.modifier_groups.length,
                }),
              "Modifier group created",
            );
          }}
        >
          Add modifier group
        </button>
      </div>

      {item.modifier_groups.map((group) => (
        <ModifierGroupEditor
          key={group.id}
          group={group}
          onChange={onChange}
          onError={onError}
          onMessage={onMessage}
        />
      ))}
    </div>
  );
}

function ModifierGroupEditor({
  group,
  onChange,
  onError,
  onMessage,
}: {
  group: MenuItemWithModifiers["modifier_groups"][number];
  onChange: () => Promise<void>;
  onError: (value: string) => void;
  onMessage: (value: string) => void;
}) {
  const [name, setName] = useState(group.name);
  const [minSelections, setMinSelections] = useState(String(group.min_selections));
  const [maxSelections, setMaxSelections] = useState(String(group.max_selections));

  async function run(action: () => Promise<unknown>, success: string) {
    onError("");
    onMessage("");
    try {
      await action();
      onMessage(success);
      await onChange();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-pine-900/15 bg-cream-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" value={name} onChange={(event) => setName(event.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={group.is_required}
            onChange={() =>
              run(
                () => updateModifierGroup(group.id, { is_required: !group.is_required }),
                "Required flag updated",
              )
            }
          />
          Required
        </label>
        <input
          className="input w-24"
          type="number"
          min="0"
          value={minSelections}
          onChange={(event) => setMinSelections(event.target.value)}
        />
        <input
          className="input w-24"
          type="number"
          min="0"
          value={maxSelections}
          onChange={(event) => setMaxSelections(event.target.value)}
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            run(
              () =>
                updateModifierGroup(group.id, {
                  name: name.trim(),
                  min_selections: Number(minSelections),
                  max_selections: Number(maxSelections),
                }),
              "Modifier group saved",
            )
          }
        >
          Save group
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            if (!confirm("Delete modifier group?")) return;
            void run(() => deleteModifierGroup(group.id), "Modifier group deleted");
          }}
        >
          Delete group
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const modifierName = prompt("Modifier name (e.g. Cheese)");
            if (!modifierName?.trim()) return;
            void run(
              () =>
                createModifier(group.id, {
                  name: modifierName.trim(),
                  price: 0,
                  sort_order: group.modifiers.length,
                }),
              "Modifier created",
            );
          }}
        >
          Add modifier
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {group.modifiers.map((modifier) => (
          <ModifierRow
            key={modifier.id}
            modifier={modifier}
            onChange={onChange}
            onError={onError}
            onMessage={onMessage}
          />
        ))}
      </div>
    </div>
  );
}

function ModifierRow({
  modifier,
  onChange,
  onError,
  onMessage,
}: {
  modifier: MenuItemWithModifiers["modifier_groups"][number]["modifiers"][number];
  onChange: () => Promise<void>;
  onError: (value: string) => void;
  onMessage: (value: string) => void;
}) {
  const [name, setName] = useState(modifier.name);
  const [price, setPrice] = useState(String(modifier.price));

  async function run(action: () => Promise<unknown>, success: string) {
    onError("");
    onMessage("");
    try {
      await action();
      onMessage(success);
      await onChange();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className="input max-w-xs" value={name} onChange={(event) => setName(event.target.value)} />
      <input
        className="input w-24"
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
      />
      <button
        type="button"
        className="btn-secondary"
        onClick={() =>
          run(
            () =>
              updateModifier(modifier.id, {
                name: name.trim(),
                price: Number(price),
              }),
            "Modifier saved",
          )
        }
      >
        Save
      </button>
      <button
        type="button"
        className="btn-danger"
        onClick={() => {
          if (!confirm("Delete modifier?")) return;
          void run(() => deleteModifier(modifier.id), "Modifier deleted");
        }}
      >
        Delete
      </button>
    </div>
  );
}

export { createMenu };
