import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/errors";
import { getServerSupabase } from "@/lib/supabase-admin";
import { getAppUrl, getStripe, platformFeeCents, toCents } from "@/lib/stripe";
import { getConnectStatus } from "@/lib/stripe-connect";
import type { Listing, Seller } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates a Stripe Checkout Session as a direct charge on the seller's
 * connected account, keeping a platform fee, and records a pending order.
 * Body: { listingId: string, buyerEmail?: string }
 */
export async function POST(request: Request) {
  let listingId = "";
  let buyerEmail = "";

  try {
    const body = (await request.json()) as {
      listingId?: unknown;
      buyerEmail?: unknown;
    };
    listingId =
      typeof body.listingId === "string" ? body.listingId.trim() : "";
    buyerEmail =
      typeof body.buyerEmail === "string"
        ? body.buyerEmail.trim().toLowerCase()
        : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!listingId) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();

    const { data: listingData, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) throw listingError;

    const listing = listingData as Listing | null;
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (listing.sold) {
      return NextResponse.json(
        { error: "This item has already been sold." },
        { status: 409 },
      );
    }

    const { data: sellerData, error: sellerError } = await supabase
      .from("sellers")
      .select("*")
      .eq("email", listing.email.trim().toLowerCase())
      .maybeSingle();

    if (sellerError) throw sellerError;

    const seller = sellerData as Seller | null;
    if (!seller) {
      return NextResponse.json(
        {
          error:
            "This seller has not finished Stripe onboarding yet, so this item can't be purchased.",
        },
        { status: 409 },
      );
    }

    // The stored flag can lag behind (e.g. while a webhook is delayed), so
    // confirm the live capability status before taking money.
    let chargesEnabled = seller.charges_enabled;
    if (!chargesEnabled) {
      try {
        const status = await getConnectStatus(seller.stripe_account_id);
        chargesEnabled = status.chargesEnabled;
        if (chargesEnabled) {
          await supabase
            .from("sellers")
            .update({
              charges_enabled: true,
              payouts_enabled: status.payoutsEnabled,
              details_submitted: status.detailsSubmitted,
              updated_at: new Date().toISOString(),
            })
            .eq("email", seller.email);
        }
      } catch {
        // Treat an unreadable account as not onboarded.
      }
    }

    if (!chargesEnabled) {
      return NextResponse.json(
        {
          error:
            "This seller has not finished Stripe onboarding yet, so this item can't be purchased.",
        },
        { status: 409 },
      );
    }

    const amountTotal = toCents(Number(listing.price));
    if (amountTotal < 50) {
      return NextResponse.json(
        { error: "Stripe requires a price of at least $0.50 to take a payment." },
        { status: 400 },
      );
    }
    const platformFee = platformFeeCents(amountTotal);

    const stripe = getStripe();
    const origin = getAppUrl(request);

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amountTotal,
              product_data: {
                name: listing.title,
                description: `${listing.category} · sold by ${listing.email}`,
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: platformFee,
          metadata: { listing_id: listing.id },
        },
        customer_email: buyerEmail || undefined,
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/listings/${listing.id}?canceled=1`,
        metadata: {
          listing_id: listing.id,
          seller_email: seller.email,
          platform_fee: String(platformFee),
        },
      },
      { stripeAccount: seller.stripe_account_id },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    const { error: orderError } = await supabase.from("orders").insert({
      listing_id: listing.id,
      seller_email: seller.email,
      buyer_email: buyerEmail || null,
      listing_title: listing.title,
      amount_total: amountTotal,
      platform_fee: platformFee,
      currency: "usd",
      status: "pending",
      stripe_session_id: session.id,
    });

    if (orderError) throw orderError;

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = errorMessage(err);
    const friendly =
      message.includes("orders") || message.includes("sellers")
        ? "The orders/sellers tables were not found. Run supabase/stripe.sql in your Supabase SQL editor."
        : message;
    return NextResponse.json(
      { error: `Could not start checkout: ${friendly}` },
      { status: 500 },
    );
  }
}
