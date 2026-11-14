import Stripe from "stripe";

/** Percentage of each sale the marketplace keeps as its platform fee. */
export const PLATFORM_FEE_PERCENT = 10;

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local.",
    );
  }
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

/** Price in dollars (as stored in Supabase) → Stripe amount in cents. */
export function toCents(price: number): number {
  return Math.max(0, Math.round(Number(price) * 100));
}

/** Platform fee in cents, rounded down so the seller is never short-changed. */
export function platformFeeCents(totalCents: number): number {
  return Math.floor((totalCents * PLATFORM_FEE_PERCENT) / 100);
}

/**
 * Public base URL for redirects. Prefers an explicit env var, then the
 * request origin (correct on Vercel production and previews).
 */
export function getAppUrl(request: Request): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}
