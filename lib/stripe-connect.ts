import { getStripe } from "@/lib/stripe";

/**
 * This sandbox platform uses Stripe "Managed Risk" (Stripe collects losses),
 * which requires Accounts v2 and, for the Express dashboard, a preview API
 * version. See docs.stripe.com/connect/risk-management/connected-accounts-with-managed-risk
 */
const PREVIEW = { apiVersion: "2026-10-28.preview" } as const;

export interface ConnectStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
}

/** Creates an Express connected account that can take direct charges. */
export async function createConnectAccount(email: string): Promise<string> {
  const stripe = getStripe();

  const account = await stripe.v2.core.accounts.create(
    {
      contact_email: email,
      display_name: "Marketplace seller",
      identity: { country: "US" },
      dashboard: "express",
      defaults: {
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
      },
      configuration: {
        merchant: { capabilities: { card_payments: { requested: true } } },
        recipient: {
          capabilities: { stripe_balance: { stripe_transfers: { requested: true } } },
        },
      },
      metadata: { marketplace_seller_email: email },
    },
    PREVIEW,
  );

  return account.id;
}

/** Reads a connected account's live capability status from Stripe. */
export async function getConnectStatus(
  accountId: string,
): Promise<ConnectStatus> {
  const stripe = getStripe();

  const account = await stripe.v2.core.accounts.retrieve(
    accountId,
    { include: ["configuration.merchant", "configuration.recipient", "requirements"] },
    PREVIEW,
  );

  const cardPayments =
    account.configuration?.merchant?.capabilities?.card_payments;
  const transfers =
    account.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers;

  const chargesEnabled = cardPayments?.status === "active";
  const payoutsEnabled = transfers?.status === "active";
  const currentlyDue = (cardPayments?.status_details ?? [])
    .map((detail) => String(detail.code ?? ""))
    .filter((code) => code.length > 0);

  return {
    accountId,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted: chargesEnabled && payoutsEnabled,
    currentlyDue,
  };
}

/** Stripe-hosted onboarding link (refreshes itself when it expires). */
export async function createOnboardingLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();

  const link = await stripe.v2.core.accountLinks.create(
    {
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
      },
    },
    PREVIEW,
  );

  return link.url;
}
