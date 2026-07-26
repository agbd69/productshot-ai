import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { removeBackgroundFromUrl } from "@/lib/server/remove-bg";

const originalFetch = globalThis.fetch;
const originalKey = process.env.REMOVE_BG_KEY;

beforeEach(() => {
  process.env.REMOVE_BG_KEY = "test-remove-bg-key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) {
    delete process.env.REMOVE_BG_KEY;
  } else {
    process.env.REMOVE_BG_KEY = originalKey;
  }
  vi.restoreAllMocks();
});

describe("removeBackgroundFromUrl", () => {
  test("POSTs to Remove.bg with the image URL and returns the cutout body", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.remove.bg/v1.0/removebg");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.["X-Api-Key"]).toBe("test-remove-bg-key");

      const body = init?.body as URLSearchParams;
      expect(body.get("image_url")).toBe("https://example.com/product.png");
      expect(body.get("size")).toBe("auto");
      expect(body.get("format")).toBe("png");

      return new Response(png, {
        headers: {
          "x-credits-charged": "1",
          "x-foreground-type": "product",
          "x-result-height": "1024",
          "x-result-width": "1024",
        },
        status: 200,
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await removeBackgroundFromUrl("https://example.com/product.png");

    expect(result.body.equals(png)).toBe(true);
    expect(result.charged).toBe(1);
    expect(result.foregroundType).toBe("product");
    expect(result.resultHeight).toBe(1024);
    expect(result.resultWidth).toBe(1024);
  });

  test("accepts custom format and size overrides", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body as URLSearchParams;
      expect(body.get("size")).toBe("preview");
      expect(body.get("format")).toBe("webp");
      return new Response(Buffer.from("ok"), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await removeBackgroundFromUrl("https://example.com/product.png", { format: "webp", size: "preview" });
  });

  test("throws when Remove.bg returns a non-2xx status", async () => {
    globalThis.fetch = vi.fn(async () => new Response("bad", { status: 402, statusText: "Payment Required" })) as unknown as typeof fetch;

    await expect(removeBackgroundFromUrl("https://example.com/product.png")).rejects.toThrow(/Remove\.bg failed: 402/);
  });

  test("throws when REMOVE_BG_KEY env is missing", async () => {
    delete process.env.REMOVE_BG_KEY;

    await expect(removeBackgroundFromUrl("https://example.com/product.png")).rejects.toThrow(/Missing required environment variable: REMOVE_BG_KEY/);
  });
});
