import Link from "next/link";
import { Clock, ImageIcon } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/format";
import type { Listing } from "@/lib/types";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col border border-fb-border bg-white shadow-card transition-colors hover:border-fb-blue"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e9ebee]">
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-fb-border">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-2 top-2 border border-fb-blue/20 bg-white/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fb-blue">
          {listing.category}
        </span>
        {listing.sold && (
          <span className="absolute right-2 top-2 border border-red-300 bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Sold
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-fb-text group-hover:text-fb-blue">
          {listing.title}
        </h3>
        <p className="text-base font-bold text-fb-text">
          {formatPrice(Number(listing.price) || 0)}
        </p>
        <div className="mt-auto flex items-center gap-1 pt-1 text-[11px] text-fb-muted">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
