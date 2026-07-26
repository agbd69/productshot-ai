import { describe, expect, test } from "vitest";

import { isClerkConfigured } from "./auth-config";

describe("isClerkConfigured", () => {
  test("detects missing and placeholder keys", () => {
    expect(isClerkConfigured({})).toBe(false);
    expect(isClerkConfigured({ CLERK_SECRET_KEY: "sk_test_replace_me", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_replace_me" })).toBe(false);
  });

  test("accepts configured-looking keys", () => {
    expect(isClerkConfigured({ CLERK_SECRET_KEY: "sk_test_live_secret", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_live_publishable" })).toBe(true);
  });
});
