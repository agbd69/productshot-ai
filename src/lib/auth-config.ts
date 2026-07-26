type ClerkEnv = Readonly<{
  CLERK_SECRET_KEY?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
}>;

export function isClerkConfigured(env: ClerkEnv = process.env as ClerkEnv) {
  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = env.CLERK_SECRET_KEY;
  return Boolean(publishableKey && secretKey && publishableKey !== "pk_test_replace_me" && secretKey !== "sk_test_replace_me");
}
