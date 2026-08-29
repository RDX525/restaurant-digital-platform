import type { FullMenu, Menu } from "@/lib/menu/types";
import {
  HARBOUR_CATEGORY_IDS,
  HARBOUR_MENU_ID,
  HARBOUR_RESTAURANT_ID,
  SEED_TIMESTAMP,
} from "./constants";

const ts = SEED_TIMESTAMP;

type ItemSeed = {
  id: string;
  name: string;
  description: string;
  price: number;
  photo?: string;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  popular?: boolean;
  recommended?: boolean;
  soldOut?: boolean;
  modifierGroups?: FullMenu["categories"][0]["items"][0]["modifier_groups"];
};

function item(
  categoryId: string,
  sortOrder: number,
  seed: ItemSeed,
): FullMenu["categories"][0]["items"][0] {
  return {
    id: seed.id,
    category_id: categoryId,
    name: seed.name,
    description: seed.description,
    price: seed.price,
    photo_url:
      seed.photo ??
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    ingredients: seed.ingredients,
    allergens: seed.allergens,
    dietary_info: seed.dietary,
    is_available: !seed.soldOut,
    is_sold_out: seed.soldOut ?? false,
    is_popular: seed.popular ?? false,
    is_recommended: seed.recommended ?? false,
    sort_order: sortOrder,
    created_at: ts,
    updated_at: ts,
    modifier_groups: seed.modifierGroups ?? [],
  };
}

const COOKING_GROUP = (itemId: string) => ({
  id: "00000000-0000-4000-8000-000000000901",
  menu_item_id: itemId,
  name: "Cooking preference",
  is_required: true,
  min_selections: 1,
  max_selections: 1,
  sort_order: 0,
  created_at: ts,
  updated_at: ts,
  modifiers: [
    {
      id: "00000000-0000-4000-8000-000000000911",
      group_id: "00000000-0000-4000-8000-000000000901",
      name: "Medium rare",
      price: 0,
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    },
    {
      id: "00000000-0000-4000-8000-000000000912",
      group_id: "00000000-0000-4000-8000-000000000901",
      name: "Medium",
      price: 0,
      sort_order: 1,
      created_at: ts,
      updated_at: ts,
    },
    {
      id: "00000000-0000-4000-8000-000000000913",
      group_id: "00000000-0000-4000-8000-000000000901",
      name: "Well done",
      price: 0,
      sort_order: 2,
      created_at: ts,
      updated_at: ts,
    },
  ],
});

const MILK_GROUP = (itemId: string) => ({
  id: "00000000-0000-4000-8000-000000000903",
  menu_item_id: itemId,
  name: "Milk",
  is_required: false,
  min_selections: 0,
  max_selections: 1,
  sort_order: 0,
  created_at: ts,
  updated_at: ts,
  modifiers: [
    {
      id: "00000000-0000-4000-8000-000000000931",
      group_id: "00000000-0000-4000-8000-000000000903",
      name: "Oat milk",
      price: 0.8,
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    },
    {
      id: "00000000-0000-4000-8000-000000000932",
      group_id: "00000000-0000-4000-8000-000000000903",
      name: "Extra shot",
      price: 0.9,
      sort_order: 1,
      created_at: ts,
      updated_at: ts,
    },
  ],
});

const BURGER_EXTRAS = (itemId: string) => ({
  id: "00000000-0000-4000-8000-000000000902",
  menu_item_id: itemId,
  name: "Add extras",
  is_required: false,
  min_selections: 0,
  max_selections: 3,
  sort_order: 0,
  created_at: ts,
  updated_at: ts,
  modifiers: [
    {
      id: "00000000-0000-4000-8000-000000000921",
      group_id: "00000000-0000-4000-8000-000000000902",
      name: "Aged cheddar",
      price: 2.5,
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    },
    {
      id: "00000000-0000-4000-8000-000000000922",
      group_id: "00000000-0000-4000-8000-000000000902",
      name: "Crispy bacon",
      price: 3.5,
      sort_order: 1,
      created_at: ts,
      updated_at: ts,
    },
  ],
});

export function buildHarbourKitchenMenus(): Menu[] {
  return [
    {
      id: HARBOUR_MENU_ID,
      restaurant_id: HARBOUR_RESTAURANT_ID,
      name: "Harbour Kitchen Menu",
      description: "Breakfast, lunch, dinner, and drinks — all day on the waterfront.",
      is_active: true,
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    },
  ];
}

export function buildHarbourKitchenFullMenu(): FullMenu {
  const lambId = "00000000-0000-4000-8000-000000000835";
  const burgerId = "00000000-0000-4000-8000-000000000825";
  const flatWhiteId = "00000000-0000-4000-8000-000000000841";

  return {
    id: HARBOUR_MENU_ID,
    restaurant_id: HARBOUR_RESTAURANT_ID,
    name: "Harbour Kitchen Menu",
    description: "Breakfast, lunch, dinner, and drinks — all day on the waterfront.",
    is_active: true,
    sort_order: 0,
    created_at: ts,
    updated_at: ts,
    categories: [
      {
        id: HARBOUR_CATEGORY_IDS.breakfast,
        menu_id: HARBOUR_MENU_ID,
        name: "Breakfast",
        sort_order: 0,
        is_active: true,
        created_at: ts,
        updated_at: ts,
        items: [
          item(HARBOUR_CATEGORY_IDS.breakfast, 0, {
            id: "00000000-0000-4000-8000-000000000811",
            name: "Big Kiwi Breakfast",
            description: "Free-range eggs, bacon, tomato, mushrooms, hash browns, and toast.",
            price: 24,
            photo: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
            ingredients: ["eggs", "bacon", "tomato", "mushrooms", "potato", "bread"],
            allergens: ["egg", "gluten"],
            dietary: [],
            popular: true,
          }),
          item(HARBOUR_CATEGORY_IDS.breakfast, 1, {
            id: "00000000-0000-4000-8000-000000000812",
            name: "Eggs Benedict",
            description: "Poached eggs, hollandaise, spinach, and sourdough.",
            price: 22,
            ingredients: ["eggs", "butter", "spinach", "sourdough"],
            allergens: ["egg", "dairy", "gluten"],
            dietary: ["vegetarian"],
            recommended: true,
          }),
          item(HARBOUR_CATEGORY_IDS.breakfast, 2, {
            id: "00000000-0000-4000-8000-000000000813",
            name: "Granola & Yoghurt Bowl",
            description: "House granola, coconut yoghurt, seasonal fruit, and mānuka honey.",
            price: 18,
            ingredients: ["oats", "coconut", "fruit", "honey"],
            allergens: ["gluten"],
            dietary: ["vegetarian"],
          }),
          item(HARBOUR_CATEGORY_IDS.breakfast, 3, {
            id: "00000000-0000-4000-8000-000000000814",
            name: "Sourdough Avocado",
            description: "Smashed avo, feta, chilli oil, and lemon on toasted sourdough.",
            price: 19,
            ingredients: ["avocado", "feta", "sourdough"],
            allergens: ["dairy", "gluten"],
            dietary: ["vegetarian"],
            popular: true,
          }),
        ],
      },
      {
        id: HARBOUR_CATEGORY_IDS.lunch,
        menu_id: HARBOUR_MENU_ID,
        name: "Lunch",
        sort_order: 1,
        is_active: true,
        created_at: ts,
        updated_at: ts,
        items: [
          item(HARBOUR_CATEGORY_IDS.lunch, 0, {
            id: "00000000-0000-4000-8000-000000000821",
            name: "Harbour Fish & Chips",
            description: "Beer-battered tarakihi, hand-cut chips, lemon, and tartare.",
            price: 26,
            photo: "https://images.unsplash.com/photo-1579208575657-c571a0069455?w=800",
            ingredients: ["fish", "potato", "flour"],
            allergens: ["fish", "gluten"],
            dietary: [],
            popular: true,
            recommended: true,
          }),
          item(HARBOUR_CATEGORY_IDS.lunch, 1, {
            id: burgerId,
            name: "Wagyu Beef Burger",
            description: "NZ wagyu patty, pickles, slaw, and chipotle mayo in a brioche bun.",
            price: 28,
            ingredients: ["beef", "brioche", "mayonnaise"],
            allergens: ["gluten", "egg"],
            dietary: [],
            modifierGroups: [BURGER_EXTRAS(burgerId)],
          }),
          item(HARBOUR_CATEGORY_IDS.lunch, 2, {
            id: "00000000-0000-4000-8000-000000000826",
            name: "Roast Pumpkin Salad",
            description: "Roasted pumpkin, quinoa, feta, seeds, and citrus dressing.",
            price: 21,
            ingredients: ["pumpkin", "quinoa", "feta", "seeds"],
            allergens: ["dairy"],
            dietary: ["vegetarian", "gluten-free"],
          }),
          item(HARBOUR_CATEGORY_IDS.lunch, 3, {
            id: "00000000-0000-4000-8000-000000000827",
            name: "Seafood Chowder",
            description: "Mussels, fish, and kūmara in a creamy chowder with sourdough.",
            price: 23,
            ingredients: ["seafood", "kumara", "cream", "sourdough"],
            allergens: ["shellfish", "fish", "dairy", "gluten"],
            dietary: [],
          }),
        ],
      },
      {
        id: HARBOUR_CATEGORY_IDS.dinner,
        menu_id: HARBOUR_MENU_ID,
        name: "Dinner",
        sort_order: 2,
        is_active: true,
        created_at: ts,
        updated_at: ts,
        items: [
          item(HARBOUR_CATEGORY_IDS.dinner, 0, {
            id: "00000000-0000-4000-8000-000000000831",
            name: "Pan-Seared Snapper",
            description: "Line-caught snapper, caper butter, seasonal greens, and lemon.",
            price: 39,
            photo: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
            ingredients: ["snapper", "butter", "capers", "greens"],
            allergens: ["fish", "dairy"],
            dietary: ["gluten-free"],
            popular: true,
            recommended: true,
          }),
          item(HARBOUR_CATEGORY_IDS.dinner, 1, {
            id: lambId,
            name: "Central Otago Lamb Rack",
            description: "Herb-crusted lamb, rosemary jus, roasted vegetables, and potato gratin.",
            price: 44,
            photo: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
            ingredients: ["lamb", "rosemary", "potato", "vegetables"],
            allergens: ["dairy"],
            dietary: [],
            popular: true,
            modifierGroups: [COOKING_GROUP(lambId)],
          }),
          item(HARBOUR_CATEGORY_IDS.dinner, 2, {
            id: "00000000-0000-4000-8000-000000000836",
            name: "Mushroom & Truffle Risotto",
            description: "Arborio rice, wild mushrooms, parmesan, and truffle oil.",
            price: 32,
            ingredients: ["rice", "mushrooms", "parmesan"],
            allergens: ["dairy"],
            dietary: ["vegetarian", "gluten-free"],
          }),
          item(HARBOUR_CATEGORY_IDS.dinner, 3, {
            id: "00000000-0000-4000-8000-000000000837",
            name: "NZ Cheese Board",
            description: "Selection of local cheeses, crackers, quince paste, and nuts.",
            price: 29,
            ingredients: ["cheese", "crackers", "nuts"],
            allergens: ["dairy", "gluten", "nuts"],
            dietary: ["vegetarian"],
          }),
          item(HARBOUR_CATEGORY_IDS.dinner, 4, {
            id: "00000000-0000-4000-8000-000000000838",
            name: "Lemon Tart",
            description: "Tangy lemon curd, Italian meringue, and berry compote.",
            price: 15,
            photo: "https://images.unsplash.com/photo-1488477181941-7818aec4585d?w=800",
            ingredients: ["egg", "butter", "lemon", "berries"],
            allergens: ["egg", "dairy", "gluten"],
            dietary: ["vegetarian"],
          }),
        ],
      },
      {
        id: HARBOUR_CATEGORY_IDS.drinks,
        menu_id: HARBOUR_MENU_ID,
        name: "Drinks",
        sort_order: 3,
        is_active: true,
        created_at: ts,
        updated_at: ts,
        items: [
          item(HARBOUR_CATEGORY_IDS.drinks, 0, {
            id: flatWhiteId,
            name: "Flat White",
            description: "Double-shot espresso with velvety steamed milk.",
            price: 5.5,
            ingredients: ["coffee", "milk"],
            allergens: ["dairy"],
            dietary: ["vegetarian"],
            popular: true,
            modifierGroups: [MILK_GROUP(flatWhiteId)],
          }),
          item(HARBOUR_CATEGORY_IDS.drinks, 1, {
            id: "00000000-0000-4000-8000-000000000842",
            name: "Long Black",
            description: "Double-shot espresso with hot water.",
            price: 5,
            ingredients: ["coffee"],
            allergens: [],
            dietary: ["vegan"],
          }),
          item(HARBOUR_CATEGORY_IDS.drinks, 2, {
            id: "00000000-0000-4000-8000-000000000843",
            name: "Marlborough Sauvignon Blanc",
            description: "175ml glass — citrus, gooseberry, and fresh herb notes.",
            price: 14,
            ingredients: ["wine"],
            allergens: ["sulphites"],
            dietary: [],
            recommended: true,
          }),
          item(HARBOUR_CATEGORY_IDS.drinks, 3, {
            id: "00000000-0000-4000-8000-000000000844",
            name: "Garage Project Pilsner",
            description: "330ml — crisp Wellington craft lager.",
            price: 11,
            ingredients: ["barley", "hops"],
            allergens: ["gluten"],
            dietary: [],
          }),
          item(HARBOUR_CATEGORY_IDS.drinks, 4, {
            id: "00000000-0000-4000-8000-000000000845",
            name: "Elderflower Spritz",
            description: "Non-alcoholic sparkling spritz with citrus and mint.",
            price: 9,
            ingredients: ["elderflower", "citrus", "mint"],
            allergens: [],
            dietary: ["vegan"],
          }),
        ],
      },
    ],
  };
}

export function getHarbourMenuItem(itemId: string) {
  const menu = buildHarbourKitchenFullMenu();
  for (const category of menu.categories) {
    const found = category.items.find((entry) => entry.id === itemId);
    if (found) return found;
  }
  return null;
}
