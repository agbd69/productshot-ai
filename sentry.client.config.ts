// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Adjust this to control the volume of errors reported. Lower = more
    // sampled. 1.0 = report everything; 0.1 = 10%.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Replays: only enable in production for now. Helps debug real-user errors
    // by recording the session leading up to a crash.
    replaysOnErrorSampleRate: 0.5,
    replaysSessionSampleRate: 0,
    debug: false,
  });
}
