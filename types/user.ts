export type SubscriptionTier = "basic" | "pro" | "enterprise";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  subscription: SubscriptionTier;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
