import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  ImageIcon,
  Mail,
  Tag,
} from "lucide-react";
import MessageSellerForm from "@/components/MessageSellerForm";
import { formatPrice, timeAgo } from "@/lib/format";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let listing: Listing | null = null;
  let error: string | null = null;

  if (!supabaseConfigured) {
    error =
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";
  } else {
    try {
      const { data, error: fetchError } = await getSupabase()
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      listing = (data as Listing | null) ?? null;
    } catch (err) {
      error =
        err instanceof Error
          ? `Could not load this listing: ${err.message}`
          : "Could not load this listing.";
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-fb-blue hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to marketplace
      </Link>

      {error ? (
        <div className="flex flex-col items-start gap-3 border border-red-200 bg-white p-6">
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
      ) : !listing ? (
        <div className="flex flex-col items-center gap-3 border border-fb-border bg-white px-6 py-16 text-center">
          <ImageIcon className="h-12 w-12 text-fb-border" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-bold text-fb-text">
              Listing not found
            </h1>
            <p className="mt-1 text-xs text-fb-muted">
              It may have been sold or removed.
            </p>
          </div>
          <Link href="/" className="btn-primary">
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Left: photo + description */}
          <div className="space-y-4 lg:col-span-3">
            <div className="border border-fb-border bg-white p-2">
              <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#e9ebee]">
                {listing.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon
                    className="h-16 w-16 text-fb-border"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            <section className="border border-fb-border bg-white">
              <div className="border-b border-fb-border bg-[#f7f8fa] px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-fb-text">
                  Description
                </h2>
              </div>
              <p className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-fb-text">
                {listing.description}
              </p>
            </section>
          </div>

          {/* Right: summary + contact */}
          <div className="lg:col-span-2">
            <section className="border border-fb-border bg-white p-4">
              <span className="inline-flex items-center gap-1 border border-fb-blue/20 bg-[#eef2fa] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-fb-blue">
                <Tag className="h-3 w-3" aria-hidden="true" />
                {listing.category}
              </span>

              <h1 className="mt-3 text-2xl font-bold leading-tight text-fb-text">
                {listing.title}
              </h1>
              <p className="mt-2 text-3xl font-bold tracking-tight text-fb-text">
                {formatPrice(Number(listing.price) || 0)}
              </p>

              <div className="mt-3 flex items-center gap-1 text-[11px] text-fb-muted">
                <Clock className="h-3 w-3" aria-hidden="true" />
                Posted {timeAgo(listing.created_at)}
              </div>

              <hr className="my-4 border-fb-border" />

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-fb-muted">
                  Seller
                </p>
                <a
                  href={`mailto:${listing.email}`}
                  className="mt-1 inline-flex items-center gap-1.5 break-all text-sm font-bold text-fb-blue hover:underline"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {listing.email}
                </a>
              </div>
            </section>

            <MessageSellerForm listingId={listing.id} />
          </div>
        </div>
      )}
    </div>
  );
}
