import { describe, expect, it } from "vitest";
import { SUPABASE_PAGE_SIZE, fetchAllQueryRows } from "./paginate";

describe("fetchAllQueryRows", () => {
  it("pages until a short page is returned", async () => {
    const pages = [
      Array.from({ length: SUPABASE_PAGE_SIZE }, (_, index) => index),
      [SUPABASE_PAGE_SIZE, SUPABASE_PAGE_SIZE + 1],
    ];

    const rows = await fetchAllQueryRows<number>(async (from) => {
      const page = from === 0 ? pages[0] : pages[1];
      return { data: page, error: null };
    });

    expect(rows).toHaveLength(SUPABASE_PAGE_SIZE + 2);
    expect(rows.at(-1)).toBe(SUPABASE_PAGE_SIZE + 1);
  });
});
