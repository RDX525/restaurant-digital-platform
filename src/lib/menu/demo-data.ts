import type { FullMenu, Menu } from "./types";
import {
  buildHarbourKitchenFullMenu,
  buildHarbourKitchenMenus,
} from "@/lib/seeds/harbour-kitchen/menu";
import { HARBOUR_MENU_ID } from "@/lib/seeds/harbour-kitchen/constants";

export const DEMO_MENU_ID = HARBOUR_MENU_ID;

export function getDemoMenus(): Menu[] {
  return buildHarbourKitchenMenus();
}

export function getDemoFullMenu(): FullMenu {
  return buildHarbourKitchenFullMenu();
}

export function isDemoMenuId(menuId: string): boolean {
  return menuId === DEMO_MENU_ID;
}
