export type Category = "dining" | "hotels" | "activities" | "transport" | "extras";

export interface Experience {
  id: string;
  title: string;
  description: string;
  category: Category;
  price_cents: number;
  image_url: string | null;
  emoji: string;
  allow_splitting: boolean;
  min_split_cents: number;
  display_order: number;
  is_active: boolean;
  funded_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  experience_id: string;
  display_name: string;
  photo_url: string | null;
  note: string | null;
  amount_cents: number;
  email: string;
  stripe_session_id: string;
  created_at: string;
}

export interface ExperienceWithSponsors extends Experience {
  sponsors: Sponsor[];
}

export interface DashboardStats {
  total_raised_cents: number;
  total_sponsors: number;
  fully_funded_count: number;
  total_experiences: number;
  average_gift_cents: number;
}
