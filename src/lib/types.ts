export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  college_email: string;
  phone: string;
  college_name: string | null;
  avatar_url: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string;
  price_inr: number;
  original_price_inr: number | null;
  condition: string;
  images: string[];
  location: string | null;
  status: 'pending' | 'active' | 'sold' | 'expired';
  views: number;
  is_negotiable: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  seller?: Profile;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan_type: 'free' | 'basic' | 'premium';
  listing_count: number;
  price_inr: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  listings_remaining: number;
  payment_verified: boolean;
  payment_screenshot_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  expires_at: string | null;
  plan?: SubscriptionPlan;
}

export interface Offer {
  id: string;
  product_id: string;
  buyer_id: string;
  offer_amount_inr: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
  product?: Product;
  buyer?: Profile;
}

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  created_at: string;
  product?: Product;
  buyer?: Profile;
  seller?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Transaction {
  id: string;
  product_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  amount_inr: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
  product?: Product;
  buyer?: Profile;
  seller?: Profile;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}
