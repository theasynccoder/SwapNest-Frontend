-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'buyer', 'seller');

-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'premium');

-- Create product status enum
CREATE TYPE public.product_status AS ENUM ('pending', 'active', 'sold', 'expired');

-- Create transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled');

-- Create offer status enum
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  college_email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  college_name TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN DEFAULT false,
  is_phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'buyer',
  UNIQUE (user_id, role)
);

-- Subscription plans pricing
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_type subscription_plan NOT NULL UNIQUE,
  listing_count INTEGER NOT NULL,
  price_inr INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, plan_type, listing_count, price_inr) VALUES
  ('Free Trial', 'free', 1, 0),
  ('Basic Pack', 'basic', 3, 100),
  ('Premium Pack', 'premium', 10, 300);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  listings_remaining INTEGER NOT NULL,
  payment_verified BOOLEAN DEFAULT false,
  payment_screenshot_url TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ
);

-- Categories for products
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert default categories
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Books & Study Materials', 'books', 'book'),
  ('Electronics', 'electronics', 'laptop'),
  ('Furniture', 'furniture', 'armchair'),
  ('Clothing', 'clothing', 'shirt'),
  ('Sports & Fitness', 'sports', 'dumbbell'),
  ('Musical Instruments', 'music', 'music'),
  ('Vehicles', 'vehicles', 'bike'),
  ('Others', 'others', 'package');

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  original_price_inr INTEGER,
  condition TEXT NOT NULL DEFAULT 'good',
  images TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  status product_status DEFAULT 'pending' NOT NULL,
  views INTEGER DEFAULT 0,
  is_negotiable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Product offers
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  offer_amount_inr INTEGER NOT NULL,
  message TEXT,
  status offer_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Chat conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Chat messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Transactions history
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_inr INTEGER NOT NULL,
  status transaction_status DEFAULT 'pending' NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Payment history for subscriptions
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE NOT NULL,
  amount_inr INTEGER NOT NULL,
  payment_screenshot_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Wishlist
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- OTP verification table
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signup',
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user listings count
CREATE OR REPLACE FUNCTION public.get_user_listings_remaining(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(listings_remaining), 0)::INTEGER
  FROM public.user_subscriptions
  WHERE user_id = _user_id AND payment_verified = true
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- User subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own subscriptions"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update subscriptions"
  ON public.user_subscriptions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  TO public
  USING (status = 'active' OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can create products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'));

-- Offers policies
CREATE POLICY "Users can view offers on own products or own offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid())
  );

CREATE POLICY "Buyers can create offers"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers and sellers can update offers"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (
    buyer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid())
  );

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Subscription payments policies
CREATE POLICY "Users can view own payments"
  ON public.subscription_payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create payments"
  ON public.subscription_payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update payments"
  ON public.subscription_payments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Wishlists policies
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete from own wishlist"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- OTP policies (only for insertion and reading own)
CREATE POLICY "Anyone can create OTP"
  ON public.otp_verifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read OTP for verification"
  ON public.otp_verifications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update OTP"
  ON public.otp_verifications FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, college_email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  
  -- Assign default buyer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer');
  
  -- Give first free listing
  INSERT INTO public.user_subscriptions (user_id, plan_id, listings_remaining, payment_verified)
  SELECT NEW.id, id, 1, true
  FROM public.subscription_plans
  WHERE plan_type = 'free';
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Function to generate and store OTP
CREATE OR REPLACE FUNCTION public.generate_otp(
  p_email TEXT,
  p_purpose TEXT DEFAULT 'signup'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate 6-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_expires_at := now() + INTERVAL '10 minutes';
  
  -- Mark old OTPs as used
  UPDATE public.otp_verifications
  SET is_used = true
  WHERE email = p_email AND is_used = false;
  
  -- Insert new OTP
  INSERT INTO public.otp_verifications (email, otp_code, purpose, expires_at)
  VALUES (p_email, v_otp, p_purpose, v_expires_at);
  
  RETURN v_otp;
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(
  p_email TEXT,
  p_otp_code TEXT,
  p_purpose TEXT DEFAULT 'signup'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if valid OTP exists
  SELECT COUNT(*) INTO v_count
  FROM public.otp_verifications
  WHERE email = p_email
    AND otp_code = p_otp_code
    AND purpose = p_purpose
    AND is_used = false
    AND expires_at > now();
  
  IF v_count > 0 THEN
    -- Mark OTP as used
    UPDATE public.otp_verifications
    SET is_used = true
    WHERE email = p_email
      AND otp_code = p_otp_code
      AND purpose = p_purpose
      AND is_used = false;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.generate_otp(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp(TEXT, TEXT, TEXT) TO anon, authenticated;