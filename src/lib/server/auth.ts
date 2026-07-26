import { currentUser } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/auth-config";
import { ensureAppUser } from "@/lib/server/users";

export async function getAuthenticatedAppUser() {
  if (!isClerkConfigured() && process.env.NODE_ENV !== "production") {
    throw new Error("Clerk 尚未配置。请先在 .env.local 中添加 Clerk keys。");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("请先登录后继续。");
  }

  return ensureAppUser(clerkUser);
}

export async function getOptionalAppUser() {
  if (!isClerkConfigured() && process.env.NODE_ENV !== "production") {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  return ensureAppUser(clerkUser);
}
