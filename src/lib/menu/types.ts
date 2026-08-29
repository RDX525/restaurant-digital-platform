export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  menu_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  ingredients: string[];
  allergens: string[];
  dietary_info: string[];
  is_available: boolean;
  is_sold_out: boolean;
  is_popular: boolean;
  is_recommended: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ModifierGroup {
  id: string;
  menu_item_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ModifierWithGroup extends Modifier {
  group: ModifierGroup;
}

export interface MenuItemWithModifiers extends MenuItem {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
}

export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItemWithModifiers[];
}

export interface FullMenu extends Menu {
  categories: MenuCategoryWithItems[];
}

export type ReorderPayload = { id: string; sort_order: number }[];
