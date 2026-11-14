import type { Metadata } from "next";
import Header from "@/components/Header";
import { supabaseConfigured } from "@/lib/supabase";
import "./globals.css";

export const metadata: Metadata = {
  title: "Browse Marketplace",
  description:
    "Buy and sell locally — electronics, vehicles, books, clothing and home goods.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <Header />
        {!supabaseConfigured && (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-800">
            Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev
            server.
          </div>
        )}
        <main>{children}</main>
        <footer className="mt-16 border-t border-fb-border bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-fb-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              Browse Marketplace &copy; {new Date().getFullYear()} — a tiny
              place to buy and sell.
            </span>
            <span>Built with Next.js + Supabase</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
