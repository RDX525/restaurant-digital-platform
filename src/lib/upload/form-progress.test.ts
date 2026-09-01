import { afterEach, describe, expect, it, vi } from "vitest";
import { postFormDataWithProgress } from "./form-progress";

class MockXHR {
  static last: MockXHR | null = null;
  upload = {
    onprogress: null as ((event: ProgressEvent<EventTarget>) => void) | null,
  };
  status = 200;
  responseText = '{"ok":true}';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  open = vi.fn();
  send = vi.fn(() => {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    } as ProgressEvent<EventTarget>);
    this.onload?.();
  });

  constructor() {
    MockXHR.last = this;
  }
}

describe("postFormDataWithProgress", () => {
  const original = globalThis.XMLHttpRequest;

  afterEach(() => {
    globalThis.XMLHttpRequest = original;
  });

  it("reports upload progress then returns the JSON body", async () => {
    globalThis.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest;
    const percents: number[] = [];

    const result = await postFormDataWithProgress(
      "/api/restaurants/upload",
      new FormData(),
      (percent) => percents.push(percent),
    );

    expect(percents).toContain(45);
    expect(percents.at(-1)).toBe(95);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
  });
});
