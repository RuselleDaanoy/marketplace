"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Nudges a server component to re-render while a webhook is still landing. */
export default function OrderStatusPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
