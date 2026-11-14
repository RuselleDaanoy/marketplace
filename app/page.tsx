"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";
import ListingCard from "@/components/ListingCard";
import Toast from "@/components/Toast";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { CATEGORIES, type Listing } from "@/lib/types";

const FILTERS = ["All", ...CATEGORIES] as const;

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("marketplace:created") === "1") {
      sessionStorage.removeItem("marketplace:created");
      setToast("Your listing is live.");
    }
  }, []);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabaseConfigured) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      );
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await getSupabase()
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setListings((data ?? []) as Listing[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message.includes("relation") ||
          message.includes("schema cache") ||
          message.includes("does not exist")
          ? "The listings table was not found. Run the SQL in supabase/schema.sql against your Supabase project."
          : `Could not load listings: ${message}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesCategory =
        category === "All" || listing.category === category;
      const matchesQuery =
        !q ||
        listing.title.toLowerCase().includes(q) ||
        (listing.description ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [listings, category, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: listings.length };
    for (const listing of listings) {
      const key =
        typeof listing.category === "string" ? listing.category : "Other";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [listings]);

  const hasFilters = query.trim() !== "" || category !== "All";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Page header / search */}
      <section className="border border-fb-border bg-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fb-text">
              Marketplace
            </h1>
            <p className="mt-1 text-xs text-fb-muted">
              Buy and sell locally — {listings.length} listing
              {listings.length === 1 ? "" : "s"} in your area.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fb-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search marketplace…"
                aria-label="Search listings by title or description"
                className="field pl-9"
              />
            </div>
            <Link
              href="/create"
              className="btn-primary shrink-0 sm:hidden"
              aria-label="Create listing"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-stretch gap-0 overflow-x-auto border-t border-fb-border bg-[#eef0f3] px-2">
          {FILTERS.map((filter) => {
            const active = filter === category;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setCategory(filter)}
                aria-pressed={active}
                className={`relative flex shrink-0 items-center gap-1.5 border-t-2 px-3 py-2.5 text-xs font-bold transition-colors ${
                  active
                    ? "border-fb-blue bg-white text-fb-blue"
                    : "border-transparent text-fb-muted hover:bg-white/60 hover:text-fb-text"
                }`}
              >
                {filter === "All" && <Tag className="h-3 w-3" aria-hidden="true" />}
                {filter}
                <span
                  className={`ml-0.5 px-1 text-[10px] font-normal ${
                    active ? "text-fb-blue/70" : "text-fb-muted"
                  }`}
                >
                  {counts[filter] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Results */}
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-fb-muted">
          {hasFilters ? "Search results" : "Fresh listings"}
          <span className="ml-2 font-normal normal-case tracking-normal text-fb-muted">
            {filtered.length} shown
          </span>
        </h2>
        <button
          type="button"
          onClick={() => void loadListings()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs font-bold text-fb-blue hover:underline disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse border border-fb-border bg-white"
            >
              <div className="aspect-[4/3] bg-[#e9ebee]" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-4/5 bg-[#e9ebee]" />
                <div className="h-4 w-1/3 bg-[#e9ebee]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-3 flex flex-col items-start gap-3 border border-red-200 bg-white p-6">
          <p className="flex items-start gap-2 text-sm font-bold text-red-700">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
          <button type="button" onClick={() => void loadListings()} className="btn-secondary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-3 border border-fb-border bg-white px-6 py-16 text-center">
          <PackageOpen className="h-12 w-12 text-fb-border" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-fb-text">
              {hasFilters ? "No listings match your search" : "No listings yet"}
            </p>
            <p className="mt-1 text-xs text-fb-muted">
              {hasFilters
                ? "Try a different keyword or category."
                : "Be the first person to post something for sale."}
            </p>
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
              className="btn-secondary"
            >
              Clear filters
            </button>
          ) : (
            <Link href="/create" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
