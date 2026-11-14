"use client";

import { useState } from "react";
import { CheckCircle2, Send, AlertCircle } from "lucide-react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import Toast from "@/components/Toast";

export default function MessageSellerForm({
  listingId,
}: {
  listingId: string;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const buyerEmail = email.trim();
    const body = message.trim();

    if (!buyerEmail || !body) {
      setError("Please enter your email and a message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!supabaseConfigured) {
      setError("Supabase is not configured. Add your keys to .env.local.");
      return;
    }

    setSending(true);
    try {
      const { error: insertError } = await getSupabase()
        .from("messages")
        .insert({
          listing_id: listingId,
          buyer_email: buyerEmail,
          message: body,
        });

      if (insertError) throw insertError;

      setEmail("");
      setMessage("");
      setSent(true);
      setToast("Your message was sent to the seller.");
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not send your message: ${err.message}`
          : "Could not send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      aria-labelledby="message-seller-heading"
      className="mt-6 border border-fb-border bg-white"
    >
      <div className="border-b border-fb-border bg-[#f7f8fa] px-4 py-3">
        <h2
          id="message-seller-heading"
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-fb-text"
        >
          <Send className="h-4 w-4 text-fb-blue" aria-hidden="true" />
          Message Seller
        </h2>
      </div>

      {sent && (
        <div className="flex items-start gap-2 border-b border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
            aria-hidden="true"
          />
          <p>
            <span className="font-bold">Message sent.</span> The seller has your
            email and will get back to you.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <div>
          <label
            htmlFor="buyer_email"
            className="mb-1 block text-xs font-bold text-fb-text"
          >
            Your email
          </label>
          <input
            id="buyer_email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field"
            required
          />
        </div>

        <div>
          <label
            htmlFor="buyer_message"
            className="mb-1 block text-xs font-bold text-fb-text"
          >
            Message
          </label>
          <textarea
            id="buyer_message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi — is this still available?"
            className="field resize-y"
            required
          />
        </div>

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

        <button type="submit" disabled={sending} className="btn-primary w-full">
          <Send className="h-4 w-4" aria-hidden="true" />
          {sending ? "Sending…" : "Send Message"}
        </button>
      </form>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </section>
  );
}
