import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Mail,
  Receipt,
} from "lucide-react";
import OrderStatusPoller from "@/components/OrderStatusPoller";
import { formatPrice } from "@/lib/format";
import { getServerSupabase } from "@/lib/supabase-admin";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmation — Browse Marketplace" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let order: Order | null = null;
  let error: string | null = null;

  if (!sessionId) {
    error = "No checkout session was provided.";
  } else {
    try {
      const { data, error: fetchError } = await getServerSupabase()
        .from("orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      order = (data as Order | null) ?? null;
    } catch (err) {
      error =
        err instanceof Error
          ? `Could not load your order: ${err.message}`
          : "Could not load your order.";
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-fb-blue hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to marketplace
      </Link>

      <div className="border border-fb-border bg-white">
        {error ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="flex items-start gap-2 text-sm font-bold text-red-700">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
            <Link href="/" className="btn-secondary">
              Browse listings
            </Link>
          </div>
        ) : order && order.status === "paid" ? (
          <>
            <div className="flex flex-col items-center gap-2 border-b border-green-200 bg-green-50 px-6 py-8 text-center">
              <CheckCircle2
                className="h-12 w-12 text-green-600"
                aria-hidden="true"
              />
              <h1 className="text-xl font-bold text-green-900">
                Payment successful
              </h1>
              <p className="text-xs text-green-800">
                Your order is confirmed and the seller has been paid.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-fb-muted">
                  Item
                </p>
                <Link
                  href={`/listings/${order.listing_id}`}
                  className="text-sm font-bold text-fb-blue hover:underline"
                >
                  {order.listing_title}
                </Link>
              </div>

              <dl className="grid grid-cols-1 gap-3 border border-fb-border bg-[#fafbfc] p-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-bold uppercase tracking-wide text-fb-muted">
                    Amount paid
                  </dt>
                  <dd className="mt-0.5 text-base font-bold text-fb-text">
                    {formatPrice(order.amount_total / 100)}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wide text-fb-muted">
                    Seller received
                  </dt>
                  <dd className="mt-0.5 font-bold text-fb-text">
                    {formatPrice(
                      (order.amount_total - order.platform_fee) / 100,
                    )}
                    <span className="ml-1 font-normal text-fb-muted">
                      (platform fee{" "}
                      {formatPrice(order.platform_fee / 100)})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wide text-fb-muted">
                    Seller
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1 break-all text-fb-text">
                    <Mail
                      className="h-3.5 w-3.5 shrink-0 text-fb-muted"
                      aria-hidden="true"
                    />
                    {order.seller_email}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wide text-fb-muted">
                    Buyer
                  </dt>
                  <dd className="mt-0.5 break-all text-fb-text">
                    {order.buyer_email ?? "—"}
                  </dd>
                </div>
              </dl>

              <p className="flex items-start gap-2 border border-fb-border bg-white px-3 py-2 text-[11px] text-fb-muted">
                <Receipt className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Order ID <span className="font-mono">{order.id}</span>
                  {order.paid_at
                    ? ` · paid ${new Date(order.paid_at).toLocaleString()}`
                    : ""}
                </span>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-8 text-center">
              <Clock className="h-12 w-12 text-amber-600" aria-hidden="true" />
              <h1 className="text-xl font-bold text-amber-900">
                {order ? "Confirming your payment" : "Payment received"}
              </h1>
              <p className="text-xs text-amber-800">
                {order
                  ? "Stripe is still confirming the payment. This page updates automatically — it usually takes a few seconds."
                  : "We couldn't find this order. If you were charged, contact the seller with your Stripe receipt."}
              </p>
            </div>

            <div className="space-y-3 p-5 text-xs text-fb-muted">
              {order && (
                <p>
                  <span className="font-bold text-fb-text">
                    {order.listing_title}
                  </span>{" "}
                  · {formatPrice(order.amount_total / 100)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/" className="btn-secondary">
                  Keep browsing
                </Link>
                {order && (
                  <Link
                    href={`/success?session_id=${encodeURIComponent(order.stripe_session_id)}`}
                    className="btn-primary"
                  >
                    Check again
                  </Link>
                )}
              </div>
            </div>
            {order && <OrderStatusPoller />}
          </>
        )}
      </div>
    </div>
  );
}
