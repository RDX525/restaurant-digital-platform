import { z } from "zod";

const stringArray = z.array(z.string().trim().min(1)).default([]);

export const menuSchema = z.object({
  name: z.string().trim().min(1, "Menu name is required").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  is_active: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

export const menuPatchSchema = z
  .object({
    name: z.string().trim().min(1, "Menu name is required").max(120).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one menu field is required",
  });

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(120),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.coerce.number().min(0, "Price must be zero or greater"),
  photo_url: z.string().url().optional().nullable().or(z.literal("")),
  ingredients: stringArray,
  allergens: stringArray,
  dietary_info: stringArray,
  is_available: z.boolean().default(true),
  is_sold_out: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  is_recommended: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

export const modifierGroupBaseSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(120),
  is_required: z.boolean().default(false),
  min_selections: z.coerce.number().int().min(0).default(0),
  max_selections: z.coerce.number().int().min(0).default(1),
  sort_order: z.number().int().min(0).default(0),
});

export const modifierGroupSchema = modifierGroupBaseSchema
  .refine((data) => data.max_selections >= data.min_selections, {
    message: "Maximum selections must be greater than or equal to minimum",
    path: ["max_selections"],
  })
  .refine(
    (data) => !data.is_required || data.min_selections >= 1,
    {
      message: "Required groups must have at least 1 minimum selection",
      path: ["min_selections"],
    },
  );

export const modifierSchema = z.object({
  name: z.string().trim().min(1, "Modifier name is required").max(120),
  price: z.coerce.number().min(0, "Price must be zero or greater"),
  sort_order: z.number().int().min(0).default(0),
});

export const reorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
  }),
);

export type MenuInput = z.infer<typeof menuSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type ModifierGroupInput = z.infer<typeof modifierGroupSchema>;
export type ModifierInput = z.infer<typeof modifierSchema>;
