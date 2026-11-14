"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      className="toast-in fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 shadow-pop"
    >
      <CheckCircle2
        className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
        aria-hidden="true"
      />
      <p className="flex-1 font-bold">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="text-green-700 hover:text-green-900"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
