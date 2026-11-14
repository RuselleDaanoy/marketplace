"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Status {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  accountId?: string;
  currentlyDue?: string[];
}

export default function SellerOnboarding({
  initialEmail,
  returned,
  refreshNeeded,
}: {
  initialEmail: string;
  returned: boolean;
  refreshNeeded: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<Status | null>(null);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async (value: string) => {
    const clean = value.trim().toLowerCase();
    if (!clean) {
      setStatus(null);
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stripe/connect/status?email=${encodeURIComponent(clean)}`,
      );
      const data = (await res.json()) as Status & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not check status.");
      setStatus(data);
    } catch (err) {
      setStatus(null);
      setError(
        err instanceof Error ? err.message : "Could not check Stripe status.",
      );
    } finally {
      setChecking(false);
    }
  }, []);

  // After returning from Stripe's hosted onboarding, refresh the flags.
  useEffect(() => {
    if (initialEmail && (returned || refreshNeeded)) {
      void checkStatus(initialEmail);
    }
  }, [initialEmail, returned, refreshNeeded, checkStatus]);

  async function startOnboarding() {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Enter the email address you use on your listings.");
      return;
    }

    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start Stripe onboarding.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start Stripe onboarding.",
      );
      setStarting(false);
    }
  }

  const onboarded = Boolean(status?.chargesEnabled);

  return (
    <section className="border border-fb-border bg-white">
      <div className="border-b border-fb-border bg-[#f7f8fa] px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-fb-text">
          <CreditCard className="h-4 w-4 text-fb-blue" aria-hidden="true" />
          Get paid with Stripe
        </h2>
        <p className="mt-1 text-xs text-fb-muted">
          Enter the email on your listings. We&apos;ll open Stripe&apos;s hosted
          onboarding — use test data, no real bank details needed.
        </p>
      </div>

      <div className="space-y-4 p-5">
        {returned && onboarded && (
          <div className="flex items-start gap-2 border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              <span className="font-bold">You&apos;re all set.</span> Your
              listings now show a Buy Now button.
            </p>
          </div>
        )}

        {status?.connected && !onboarded && (
          <div className="flex items-start gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-bold">Onboarding incomplete.</span> Stripe
              still needs a few details before you can be paid. Click Connect
              with Stripe to continue.
            </p>
          </div>
        )}

        {onboarded && !returned && (
          <div className="flex items-start gap-2 border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              <span className="font-bold">Payments enabled.</span> Charges and
              payouts are active for this account.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="seller_email" className="mb-1 block text-xs font-bold">
            Seller email
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="seller_email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field flex-1"
            />
            <button
              type="button"
              onClick={() => void checkStatus(email)}
              disabled={checking || !email.trim()}
              className="btn-secondary shrink-0"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              Check status
            </button>
          </div>
        </div>

        {status?.accountId && (
          <dl className="grid grid-cols-1 gap-2 border border-fb-border bg-[#fafbfc] p-3 text-[11px] sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-wide text-fb-muted">
                Connected account
              </dt>
              <dd className="break-all font-mono text-fb-text">
                {status.accountId}
              </dd>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-fb-muted">Charges enabled</span>
                <span
                  className={
                    status.chargesEnabled
                      ? "font-bold text-green-700"
                      : "font-bold text-red-600"
                  }
                >
                  {status.chargesEnabled ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-fb-muted">Payouts enabled</span>
                <span
                  className={
                    status.payoutsEnabled
                      ? "font-bold text-green-700"
                      : "font-bold text-red-600"
                  }
                >
                  {status.payoutsEnabled ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </dl>
        )}

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
          >
            <AlertCircle
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void startOnboarding()}
          disabled={starting}
          className="btn-primary w-full"
        >
          {starting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CreditCard className="h-4 w-4" aria-hidden="true" />
          )}
          {starting
            ? "Opening Stripe…"
            : onboarded
              ? "Update Stripe details"
              : "Connect with Stripe"}
        </button>
      </div>
    </section>
  );
}
