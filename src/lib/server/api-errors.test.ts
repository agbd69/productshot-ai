import { describe, expect, test } from "vitest";

import { getErrorStatus } from "@/lib/server/api-errors";

describe("getErrorStatus", () => {
  test("maps Chinese and English sign-in errors to 401", () => {
    expect(getErrorStatus("请先登录后继续。")).toBe(401);
    expect(getErrorStatus("Sign in to continue.")).toBe(401);
  });

  test("uses a fallback status for non-auth errors", () => {
    expect(getErrorStatus("额度不足，请先购买 credits 后继续。", 500)).toBe(500);
  });
});
