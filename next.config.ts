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

export default nextConfig;
