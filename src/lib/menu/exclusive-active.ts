export function exclusiveMenuActiveStates(
  menus: { id: string; is_active: boolean }[],
  menuId: string,
  nextActive: boolean,
): { id: string; is_active: boolean }[] {
  return menus.map((menu) => {
    if (menu.id === menuId) {
      return { id: menu.id, is_active: nextActive };
    }
    if (nextActive) {
      return { id: menu.id, is_active: false };
    }
    return { id: menu.id, is_active: menu.is_active };
  });
}
