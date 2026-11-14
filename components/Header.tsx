"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Store } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-fb-blue">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center border border-white/30 bg-white/10">
            <Store className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Browse Marketplace
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className={`hidden text-xs font-bold sm:block ${
              pathname === "/"
                ? "text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            Browse
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 border border-white/40 bg-white px-3 py-1.5 text-xs font-bold text-fb-blue transition-colors hover:bg-[#e9edf6] sm:text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Listing
          </Link>
        </nav>
      </div>
    </header>
  );
}
