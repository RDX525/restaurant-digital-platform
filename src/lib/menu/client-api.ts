import type { FullMenu } from "@/lib/menu/types";
import { getErrorMessage } from "@/lib/utils";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload as T;
}

export async function fetchMenu(
  menuId: string,
  options?: { full?: boolean },
): Promise<FullMenu> {
  const query = options?.full ? "?full=1" : "";
  const response = await fetch(`/api/menus/${menuId}${query}`, { cache: "no-store" });
  return parseJson<FullMenu>(response);
}

export async function saveMenu(
  menuId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`/api/menus/${menuId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await parseJson(response);
}

export async function createCategory(
  menuId: string,
  name: string,
  sortOrder: number,
) {
  const response = await fetch(`/api/menus/${menuId}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sort_order: sortOrder }),
  });
  return parseJson(response);
}

export async function updateCategory(
  categoryId: string,
  data: Record<string, unknown>,
) {
  const response = await fetch(`/api/categories/${categoryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function deleteCategory(categoryId: string) {
  const response = await fetch(`/api/categories/${categoryId}`, {
    method: "DELETE",
  });
  return parseJson(response);
}

export async function reorderCategories(
  menuId: string,
  rows: { id: string; sort_order: number }[],
) {
  return reorderRows(`/api/menus/${menuId}/categories`, rows);
}

export async function reorderItems(
  categoryId: string,
  rows: { id: string; sort_order: number }[],
) {
  return reorderRows(`/api/categories/${categoryId}/items`, rows);
}

export async function createItem(
  categoryId: string,
  data: Record<string, unknown>,
) {
  const response = await fetch(`/api/categories/${categoryId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function updateItem(itemId: string, data: Record<string, unknown>) {
  const response = await fetch(`/api/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function deleteItem(itemId: string) {
  const response = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
  return parseJson(response);
}

export async function createModifierGroup(
  itemId: string,
  data: Record<string, unknown>,
) {
  const response = await fetch(`/api/items/${itemId}/modifier-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function updateModifierGroup(
  groupId: string,
  data: Record<string, unknown>,
) {
  const response = await fetch(`/api/modifier-groups/${groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function deleteModifierGroup(groupId: string) {
  const response = await fetch(`/api/modifier-groups/${groupId}`, {
    method: "DELETE",
  });
  return parseJson(response);
}

export async function createModifier(
  groupId: string,
  data: Record<string, unknown>,
) {
  const response = await fetch(`/api/modifier-groups/${groupId}/modifiers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function updateModifier(
  modifierId: string,
  data: Record<string, unknown>,
) {
  const response = await fetch(`/api/modifiers/${modifierId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function deleteModifier(modifierId: string) {
  const response = await fetch(`/api/modifiers/${modifierId}`, {
    method: "DELETE",
  });
  return parseJson(response);
}

export async function uploadItemImage(itemId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("itemId", itemId);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? getErrorMessage("Upload failed"));
  }

  return parseJson<{ photo_url: string }>(response);
}

export async function createMenu(data: Record<string, unknown>) {
  const response = await fetch("/api/menus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function deleteMenu(menuId: string) {
  const response = await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
  return parseJson(response);
}

export async function reorderRows(
  endpoint: string,
  rows: { id: string; sort_order: number }[],
) {
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rows),
  });
  await parseJson(response);
}
