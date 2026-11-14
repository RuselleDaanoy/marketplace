import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/errors";
import {
  createConnectAccount,
  createOnboardingLink,
} from "@/lib/stripe-connect";
import { getAppUrl } from "@/lib/stripe";
import { getServerSupabase } from "@/lib/supabase-admin";
import type { Seller } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Starts Stripe Connect onboarding for a seller.
 * Body: { email: string } — the email used on their listings.
 * Returns: { url } — the Stripe-hosted onboarding link.
 */
export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const supabase = getServerSupabase();

    const { data: existing, error: selectError } = await supabase
      .from("sellers")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (selectError) throw selectError;

    const seller = existing as Seller | null;
    let accountId = seller?.stripe_account_id ?? null;

    if (!accountId) {
      accountId = await createConnectAccount(email);

      const { error: upsertError } = await supabase.from("sellers").upsert(
        {
          email,
          stripe_account_id: accountId,
          details_submitted: false,
          charges_enabled: false,
          payouts_enabled: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );

      if (upsertError) throw upsertError;
    }

    const origin = getAppUrl(request);
    const url = await createOnboardingLink(
      accountId,
      `${origin}/sell?email=${encodeURIComponent(email)}&refresh=1`,
      `${origin}/sell?email=${encodeURIComponent(email)}&returned=1`,
    );

    return NextResponse.json({ url });
  } catch (err) {
    const message = errorMessage(err);
    const friendly = message.includes("sellers")
      ? "The sellers table was not found. Run supabase/stripe.sql in your Supabase SQL editor."
      : message;
    return NextResponse.json(
      { error: `Could not start Stripe onboarding: ${friendly}` },
      { status: 500 },
    );
  }
}
