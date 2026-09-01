import { describe, expect, it } from "vitest";
import { browserHasTableSessionCookie, TABLE_SESSION_COOKIE } from "./session";

describe("browserHasTableSessionCookie", () => {
  it("is false during server rendering", () => {
    expect(browserHasTableSessionCookie()).toBe(false);
  });

  it("detects the table session cookie in the browser", () => {
    const documentRef = globalThis as { document?: { cookie: string } };
    const previous = documentRef.document;
    documentRef.document = { cookie: `${TABLE_SESSION_COOKIE}=abc; other=1` };
    expect(browserHasTableSessionCookie()).toBe(true);
    documentRef.document = { cookie: "other=1" };
    expect(browserHasTableSessionCookie()).toBe(false);
    if (previous) documentRef.document = previous;
    else delete documentRef.document;
  });
});
