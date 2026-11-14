import { formatDistanceToNow } from "date-fns";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function timeAgo(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "recently";
  return formatDistanceToNow(parsed, { addSuffix: true });
}
