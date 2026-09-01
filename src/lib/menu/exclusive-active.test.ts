import { describe, expect, it } from "vitest";
import { exclusiveMenuActiveStates } from "./exclusive-active";

describe("exclusiveMenuActiveStates", () => {
  const menus = [
    { id: "menu-1", is_active: true },
    { id: "menu-2", is_active: false },
  ];

  it("activates one menu and deactivates the others", () => {
    expect(exclusiveMenuActiveStates(menus, "menu-2", true)).toEqual([
      { id: "menu-1", is_active: false },
      { id: "menu-2", is_active: true },
    ]);
  });

  it("can deactivate the live menu without activating another", () => {
    expect(exclusiveMenuActiveStates(menus, "menu-1", false)).toEqual([
      { id: "menu-1", is_active: false },
      { id: "menu-2", is_active: false },
    ]);
  });
});
