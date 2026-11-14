"use client";

import { useState } from "react";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";

export default function BuyNowButton({
  listingId,
  price,
}: {
  listingId: string;
  price: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start checkout.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <CreditCard className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? "Opening checkout…" : `Buy Now — ${price}`}
      </button>

      <p className="mt-2 text-center text-[11px] text-fb-muted">
        Secure payment by Stripe. The seller is paid directly; the marketplace
        keeps a 10% fee.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
        >
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  );
}
