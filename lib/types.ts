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
}

export interface Message {
  id: string;
  listing_id: string;
  buyer_email: string;
  message: string;
  created_at: string;
}
