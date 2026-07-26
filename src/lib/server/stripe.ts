import Stripe from "stripe";

import { requireEnv } from "@/lib/server/env";

export function getStripe() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"));
}
