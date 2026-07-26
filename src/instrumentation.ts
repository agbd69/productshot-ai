// Edge runtime Sentry init. Runs on Vercel Edge / middleware.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export async function onRequestError(caught: unknown, request: unknown, context: unknown) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(caught, { extra: { request, context } });
}
