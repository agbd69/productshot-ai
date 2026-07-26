import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

/**
 * ProductShot.ai — Next.js 16 + React 19 SaaS.
 *
 * We host long-running generation calls inline (within the request lifetime)
 * because the user is waiting on the result before they navigate to the
 * result page. Set `maxDuration` to 60s for the generate route; the route
 * itself returns immediately after kicking off the job and the client polls
 * the result page.
 */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // fal.ai returns image URLs from a different host than the app; allow
    // them through Next's image optimization.
    remotePatterns: [
      { hostname: "**.fal.media" },
      { hostname: "**.fal.ai" },
      { hostname: "**.supabase.co" },
    ],
  },
};

// Sentry config wrapper. Only takes effect when SENTRY_AUTH_TOKEN is set
// during the build (i.e. when you wire up a Sentry project and want source
// maps uploaded). For Vercel, add the org / project / auth token env vars
// and these flags activate automatically.
const sentryBuildOptions = {
  // Disable telemetry on the build itself; the SDK is what we care about.
  telemetry: false,
  // Don't fail the build if Sentry isn't configured.
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Strip framework info from bundle for source map debugging.
  widenClientFileUpload: true,
  hideSourceMaps: true,
};

export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryBuildOptions)
  : nextConfig;
