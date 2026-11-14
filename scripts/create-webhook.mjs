// Registers the Stripe Connect webhook endpoint for the deployed app and
// prints its signing secret (Stripe only shows it once).
//
//   node --env-file=.env.local scripts/create-webhook.mjs https://your-app.vercel.app
//
// Use the public production URL, not a preview URL (previews are protected).
import Stripe from "stripe";

const base =
  process.argv[2] ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null);

if (!base) {
  console.error(
    "Usage: node --env-file=.env.local scripts/create-webhook.mjs https://your-app.vercel.app",
  );
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpoint = await stripe.webhookEndpoints.create({
  url: `${base.replace(/\/$/, "")}/api/stripe/webhook`,
  connect: true, // payments are created on connected accounts
  enabled_events: ["checkout.session.completed", "account.updated"],
});

console.log("Webhook endpoint:", endpoint.url);
console.log("Signing secret:", endpoint.secret);
console.log(
  "\nAdd that whsec_... value as STRIPE_WEBHOOK_SECRET in .env.local and in Vercel, then redeploy.",
);
