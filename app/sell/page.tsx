import Link from "next/link";
import { ArrowLeft, BadgeCheck, Banknote, ShieldCheck } from "lucide-react";
import SellerOnboarding from "@/components/SellerOnboarding";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sell with Stripe — Browse Marketplace" };

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; returned?: string; refresh?: string }>;
}) {
  const params = await searchParams;
  const initialEmail = (params.email ?? "").trim().toLowerCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-fb-blue hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to marketplace
      </Link>

      <div className="border border-fb-border bg-white">
        <div className="border-b border-fb-border px-5 py-4">
          <h1 className="text-xl font-bold text-fb-text">Sell with Stripe</h1>
          <p className="mt-0.5 text-xs text-fb-muted">
            Get paid when someone buys your listing. Payments are handled by
            Stripe — this is a test-mode sandbox, so no real money moves.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-fb-border bg-[#fafbfc] px-5 py-4 sm:grid-cols-3">
          {[
            {
              icon: Banknote,
              title: "Paid directly",
              body: "Buyers pay through Stripe Checkout and the money lands in your Stripe balance.",
            },
            {
              icon: BadgeCheck,
              title: "10% platform fee",
              body: "The marketplace keeps a small fee on each sale; the rest is yours.",
            },
            {
              icon: ShieldCheck,
              title: "Sell safely",
              body: "Stripe handles the card details — they never touch this site.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-2">
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-fb-blue"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-bold text-fb-text">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-fb-muted">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {!stripeConfigured && (
          <p className="border-b border-amber-300 bg-amber-50 px-5 py-2 text-xs font-bold text-amber-900">
            Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local (and to
            your Vercel environment variables) and redeploy.
          </p>
        )}

        <div className="p-5">
          <SellerOnboarding
            initialEmail={initialEmail}
            returned={params.returned === "1"}
            refreshNeeded={params.refresh === "1"}
          />
        </div>
      </div>
    </div>
  );
}
