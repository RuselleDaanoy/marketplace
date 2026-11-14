import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/errors";
import { getConnectStatus } from "@/lib/stripe-connect";
import { getServerSupabase } from "@/lib/supabase-admin";
import type { Seller } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Refreshes a seller's onboarding state from Stripe.
 * GET /api/stripe/connect/status?email=...
 */
export async function GET(request: Request) {
  const email = (
    new URL(request.url).searchParams.get("email") ?? ""
  )
    .trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("sellers")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    const seller = data as Seller | null;
    if (!seller) {
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    }

    const status = await getConnectStatus(seller.stripe_account_id);

    if (
      status.chargesEnabled !== seller.charges_enabled ||
      status.payoutsEnabled !== seller.payouts_enabled ||
      status.detailsSubmitted !== seller.details_submitted
    ) {
      const { error: updateError } = await supabase
        .from("sellers")
        .update({
          charges_enabled: status.chargesEnabled,
          payouts_enabled: status.payoutsEnabled,
          details_submitted: status.detailsSubmitted,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      connected: true,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      accountId: status.accountId,
      currentlyDue: status.currentlyDue,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not load Stripe status: ${errorMessage(err)}` },
      { status: 500 },
    );
  }
}
