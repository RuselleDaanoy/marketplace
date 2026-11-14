export const CATEGORIES = [
  "Electronics",
  "Vehicles",
  "Books",
  "Clothing",
  "Home",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  email: string;
  category: string;
  image_url: string | null;
  created_at: string;
  sold?: boolean;
  sold_at?: string | null;
}

export interface Message {
  id: string;
  listing_id: string;
  buyer_email: string;
  message: string;
  created_at: string;
}

export interface Seller {
  email: string;
  stripe_account_id: string;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  listing_id: string;
  seller_email: string;
  buyer_email: string | null;
  listing_title: string;
  amount_total: number;
  platform_fee: number;
  currency: string;
  status: "pending" | "paid" | "expired";
  stripe_session_id: string;
  stripe_payment_intent: string | null;
  paid_at: string | null;
  created_at: string;
}
