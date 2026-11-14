import Stripe from "stripe";
import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/errors";
import { getServerSupabase } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook for the Connect endpoint (connect: true).
 * - checkout.session.completed → mark order paid, mark listing sold
 * - account.updated           → refresh the seller's onboarding flags
 *
 * The sandbox is shared with other candidates, so anything we don't
 * recognise is acknowledged with 200 and ignored.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = errorMessage(err);
    return NextResponse.json(
      { error: `Invalid signature: ${message}` },
      { status: 400 },
    );
  }

  const supabase = getServerSupabase();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const listingId = session.metadata?.listing_id;

      // Not one of our orders in this shared sandbox.
      if (!listingId) return NextResponse.json({ received: true });

      const { data: order, error: orderLookupError } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (orderLookupError) throw orderLookupError;
      if (!order) return NextResponse.json({ received: true });

      const buyerEmail =
        session.customer_details?.email ?? session.customer_email ?? null;

      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          buyer_email: buyerEmail,
          stripe_payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          paid_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", session.id);

      if (updateOrderError) throw updateOrderError;

      const { error: updateListingError } = await supabase
        .from("listings")
        .update({ sold: true, sold_at: new Date().toISOString() })
        .eq("id", listingId);

      if (updateListingError) throw updateListingError;
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;

      // Shared sandbox: only update accounts we created and saved.
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("email")
        .eq("stripe_account_id", account.id)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (seller) {
        const { error: updateError } = await supabase
          .from("sellers")
          .update({
            charges_enabled: Boolean(account.charges_enabled),
            payouts_enabled: Boolean(account.payouts_enabled),
            details_submitted: Boolean(account.details_submitted),
            updated_at: new Date().toISOString(),
          })
          .eq("email", seller.email);

        if (updateError) throw updateError;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = errorMessage(err);
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 },
    );
  }
}
