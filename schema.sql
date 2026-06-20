-- ============================================
-- BUYNEST DATABASE SCHEMA
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- for fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- for search normalization

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin', 'super_admin', 'delivery_partner');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method AS ENUM ('razorpay', 'cod', 'wallet', 'upi', 'card', 'netbanking', 'emi');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive', 'out_of_stock');
CREATE TYPE coupon_type AS ENUM ('percentage', 'flat', 'free_shipping', 'buy_x_get_y');
CREATE TYPE notification_type AS ENUM ('order', 'payment', 'promo', 'system', 'review', 'chat');
CREATE TYPE address_type AS ENUM ('home', 'work', 'other');
CREATE TYPE return_status AS ENUM ('requested', 'approved', 'picked', 'received', 'refunded', 'rejected');
CREATE TYPE seller_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  display_name  TEXT,
  phone         TEXT UNIQUE,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'customer',
  is_verified   BOOLEAN DEFAULT FALSE,
  is_blocked    BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other')),
  referral_code TEXT UNIQUE DEFAULT UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 8)),
  referred_by   UUID REFERENCES profiles(id),
  wallet_balance DECIMAL(12,2) DEFAULT 0.00 CHECK (wallet_balance >= 0),
  loyalty_points INTEGER DEFAULT 0,
  gstin         TEXT,
  preferences   JSONB DEFAULT '{}',
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADDRESSES
-- ============================================
CREATE TABLE addresses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         address_type DEFAULT 'home',
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  pincode      TEXT NOT NULL,
  country      TEXT DEFAULT 'India',
  landmark     TEXT,
  is_default   BOOLEAN DEFAULT FALSE,
  lat          DECIMAL(10,8),
  lng          DECIMAL(11,8),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  parent_id   UUID REFERENCES categories(id),
  icon        TEXT,
  color       TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  meta_title  TEXT,
  meta_desc   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BRANDS
-- ============================================
CREATE TABLE brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  description TEXT,
  website     TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SELLERS
-- ============================================
CREATE TABLE sellers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_name      TEXT NOT NULL,
  store_slug      TEXT UNIQUE NOT NULL,
  store_logo      TEXT,
  store_banner    TEXT,
  description     TEXT,
  gstin           TEXT UNIQUE,
  pan             TEXT,
  bank_name       TEXT,
  bank_account    TEXT,
  ifsc_code       TEXT,
  status          seller_status DEFAULT 'pending',
  rating          DECIMAL(3,2) DEFAULT 0,
  total_sales     INTEGER DEFAULT 0,
  total_revenue   DECIMAL(14,2) DEFAULT 0,
  commission_rate DECIMAL(4,2) DEFAULT 10.00,
  address         JSONB,
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id        UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES categories(id),
  brand_id         UUID REFERENCES brands(id),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT,
  short_desc       TEXT,
  sku              TEXT UNIQUE,
  barcode          TEXT,
  price            DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  mrp              DECIMAL(12,2) NOT NULL CHECK (mrp >= price),
  cost_price       DECIMAL(12,2),
  discount_percent DECIMAL(5,2) GENERATED ALWAYS AS (ROUND(((mrp - price) / mrp * 100), 2)) STORED,
  gst_rate         DECIMAL(4,2) DEFAULT 18.00,
  hsn_code         TEXT,
  stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_alert  INTEGER DEFAULT 10,
  weight           DECIMAL(8,3),
  dimensions       JSONB,                     -- { l, w, h, unit }
  specifications   JSONB DEFAULT '[]',        -- [{ key, value }]
  highlights       JSONB DEFAULT '[]',        -- [string]
  tags             TEXT[] DEFAULT '{}',
  status           product_status DEFAULT 'draft',
  is_featured      BOOLEAN DEFAULT FALSE,
  is_returnable    BOOLEAN DEFAULT TRUE,
  return_days      INTEGER DEFAULT 7,
  is_cod           BOOLEAN DEFAULT TRUE,
  shipping_charge  DECIMAL(8,2) DEFAULT 0,
  free_shipping_above DECIMAL(10,2) DEFAULT 499,
  rating           DECIMAL(3,2) DEFAULT 0,
  review_count     INTEGER DEFAULT 0,
  sold_count       INTEGER DEFAULT 0,
  view_count       INTEGER DEFAULT 0,
  search_vector    TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_desc, ''))
  ) STORED,
  meta_title       TEXT,
  meta_desc        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_sold ON products(sold_count DESC);

-- ============================================
-- PRODUCT IMAGES
-- ============================================
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_primary  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT VARIANTS
-- ============================================
CREATE TABLE product_variants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,              -- e.g. "Color", "Size"
  value       TEXT NOT NULL,             -- e.g. "Red", "XL"
  sku         TEXT UNIQUE,
  price       DECIMAL(12,2),
  mrp         DECIMAL(12,2),
  stock       INTEGER DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT VIDEOS
-- ============================================
CREATE TABLE product_videos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  thumbnail   TEXT,
  title       TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY LOGS
-- ============================================
CREATE TABLE inventory_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id),
  variant_id  UUID REFERENCES product_variants(id),
  type        TEXT CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'return')),
  quantity    INTEGER NOT NULL,
  previous    INTEGER NOT NULL,
  after       INTEGER NOT NULL,
  reason      TEXT,
  ref_id      TEXT,       -- order_id, purchase_order_id, etc.
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CART
-- ============================================
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID REFERENCES product_variants(id),
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price       DECIMAL(12,2) NOT NULL,
  mrp         DECIMAL(12,2) NOT NULL,
  saved_for_later BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- ============================================
-- WISHLIST
-- ============================================
CREATE TABLE wishlist_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE coupons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id        UUID REFERENCES sellers(id),     -- NULL = platform-wide
  code             TEXT UNIQUE NOT NULL,
  type             coupon_type NOT NULL,
  value            DECIMAL(10,2) NOT NULL,          -- % or flat amount
  min_order        DECIMAL(10,2) DEFAULT 0,
  max_discount     DECIMAL(10,2),
  usage_limit      INTEGER,
  per_user_limit   INTEGER DEFAULT 1,
  used_count       INTEGER DEFAULT 0,
  category_ids     UUID[],
  product_ids      UUID[],
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until      TIMESTAMPTZ NOT NULL,
  is_active        BOOLEAN DEFAULT TRUE,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number     TEXT UNIQUE NOT NULL DEFAULT ('BN-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 8))),
  user_id          UUID NOT NULL REFERENCES profiles(id),
  status           order_status DEFAULT 'pending',
  subtotal         DECIMAL(12,2) NOT NULL,
  discount         DECIMAL(12,2) DEFAULT 0,
  shipping_charge  DECIMAL(10,2) DEFAULT 0,
  tax_amount       DECIMAL(12,2) DEFAULT 0,
  total_amount     DECIMAL(12,2) NOT NULL,
  coupon_id        UUID REFERENCES coupons(id),
  coupon_discount  DECIMAL(10,2) DEFAULT 0,
  wallet_used      DECIMAL(10,2) DEFAULT 0,
  payment_method   payment_method NOT NULL,
  payment_status   payment_status DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  billing_address  JSONB,
  gstin            TEXT,
  gst_invoice_no   TEXT,
  notes            TEXT,
  cancelled_at     TIMESTAMPTZ,
  cancel_reason    TEXT,
  delivered_at     TIMESTAMPTZ,
  expected_delivery DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  variant_id   UUID REFERENCES product_variants(id),
  seller_id    UUID NOT NULL REFERENCES sellers(id),
  name         TEXT NOT NULL,
  image_url    TEXT,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  price        DECIMAL(12,2) NOT NULL,
  mrp          DECIMAL(12,2) NOT NULL,
  discount     DECIMAL(12,2) DEFAULT 0,
  gst_rate     DECIMAL(4,2),
  gst_amount   DECIMAL(10,2),
  total        DECIMAL(12,2) NOT NULL,
  status       order_status DEFAULT 'pending',
  tracking_no  TEXT,
  courier      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER TRACKING
-- ============================================
CREATE TABLE order_tracking (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id),
  status      order_status NOT NULL,
  description TEXT,
  location    TEXT,
  lat         DECIMAL(10,8),
  lng         DECIMAL(11,8),
  updated_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID NOT NULL REFERENCES orders(id),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount            DECIMAL(12,2) NOT NULL,
  currency          TEXT DEFAULT 'INR',
  method            payment_method NOT NULL,
  status            payment_status DEFAULT 'pending',
  gateway_response  JSONB,
  refund_id         TEXT,
  refund_amount     DECIMAL(12,2),
  refunded_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RETURN REQUESTS
-- ============================================
CREATE TABLE return_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id),
  order_item_id  UUID NOT NULL REFERENCES order_items(id),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  reason         TEXT NOT NULL,
  description    TEXT,
  images         TEXT[],
  status         return_status DEFAULT 'requested',
  refund_amount  DECIMAL(12,2),
  exchange_product_id UUID REFERENCES products(id),
  pickup_address JSONB,
  pickup_date    DATE,
  approved_by    UUID REFERENCES profiles(id),
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id),
  order_item_id    UUID REFERENCES order_items(id),
  rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title            TEXT,
  body             TEXT,
  images           TEXT[],
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_votes    INTEGER DEFAULT 0,
  status           review_status DEFAULT 'pending',
  seller_reply     TEXT,
  seller_reply_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, order_item_id)
);

-- ============================================
-- REVIEW HELPFUL VOTES
-- ============================================
CREATE TABLE review_votes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  image_url   TEXT,
  action_url  TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- WALLET TRANSACTIONS
-- ============================================
CREATE TABLE wallet_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  type        TEXT CHECK (type IN ('credit', 'debit')),
  amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  balance     DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  ref_type    TEXT,     -- 'order', 'refund', 'referral', 'cashback', 'topup'
  ref_id      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOYALTY POINTS
-- ============================================
CREATE TABLE loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  type        TEXT CHECK (type IN ('earned', 'redeemed', 'expired')),
  points      INTEGER NOT NULL,
  balance     INTEGER NOT NULL,
  description TEXT,
  ref_id      TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFERRALS
-- ============================================
CREATE TABLE referrals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id   UUID NOT NULL REFERENCES profiles(id),
  referred_id   UUID NOT NULL REFERENCES profiles(id),
  status        TEXT CHECK (status IN ('pending', 'completed', 'rewarded')) DEFAULT 'pending',
  reward_amount DECIMAL(10,2),
  order_id      UUID REFERENCES orders(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- ============================================
-- BANNERS
-- ============================================
CREATE TABLE banners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT,
  image_url   TEXT NOT NULL,
  mobile_url  TEXT,
  link        TEXT,
  type        TEXT CHECK (type IN ('hero', 'flash_sale', 'category', 'brand', 'promo')) DEFAULT 'hero',
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  valid_from  TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEARCH HISTORY
-- ============================================
CREATE TABLE search_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  query      TEXT NOT NULL,
  results    INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECENTLY VIEWED
-- ============================================
CREATE TABLE recently_viewed (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- FLASH SALES
-- ============================================
CREATE TABLE flash_sales (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  banner_url   TEXT,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flash_sale_products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_sale_id  UUID NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_price     DECIMAL(12,2) NOT NULL,
  stock_limit    INTEGER,
  sold_count     INTEGER DEFAULT 0,
  UNIQUE(flash_sale_id, product_id)
);

-- ============================================
-- GIFT CARDS
-- ============================================
CREATE TABLE gift_cards (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(random()::TEXT), 1, 16)),
  amount       DECIMAL(10,2) NOT NULL,
  balance      DECIMAL(10,2) NOT NULL,
  issued_to    UUID REFERENCES profiles(id),
  issued_by    UUID REFERENCES profiles(id),
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPORT TICKETS
-- ============================================
CREATE TABLE support_tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  order_id    UUID REFERENCES orders(id),
  subject     TEXT NOT NULL,
  description TEXT NOT NULL,
  status      TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority    TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  message     TEXT NOT NULL,
  attachments TEXT[],
  is_internal BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT COMPARISONS
-- ============================================
CREATE TABLE compare_products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_ids UUID[] NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- NEWSLETTER SUBSCRIPTIONS
-- ============================================
CREATE TABLE newsletter_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  user_id    UUID REFERENCES profiles(id),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Update updated_at on all tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_profiles    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE OR REPLACE TRIGGER set_updated_at_products    BEFORE UPDATE ON products    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE OR REPLACE TRIGGER set_updated_at_orders      BEFORE UPDATE ON orders      FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE OR REPLACE TRIGGER set_updated_at_sellers     BEFORE UPDATE ON sellers     FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE OR REPLACE TRIGGER set_updated_at_reviews     BEFORE UPDATE ON reviews     FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE OR REPLACE TRIGGER set_updated_at_addresses   BEFORE UPDATE ON addresses   FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Update product rating when review is added/approved
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    rating = (SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0) FROM reviews WHERE product_id = NEW.product_id AND status = 'approved'),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id AND status = 'approved')
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_review_change
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_product_rating();

-- Update stock on order
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE products SET stock = stock - (
      SELECT SUM(quantity) FROM order_items WHERE order_id = NEW.id AND product_id = products.id
    ) WHERE id IN (SELECT product_id FROM order_items WHERE order_id = NEW.id);
    UPDATE products SET sold_count = sold_count + 1
    WHERE id IN (SELECT product_id FROM order_items WHERE order_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_order_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_stock_on_order();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands               ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners              ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sale_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages     ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own; admins see all
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Addresses
CREATE POLICY "addresses_own" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Cart
CREATE POLICY "cart_own" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Wishlist
CREATE POLICY "wishlist_own" ON wishlist_items FOR ALL USING (auth.uid() = user_id);

-- Orders: customer sees own; seller sees their items; admin sees all
CREATE POLICY "orders_customer" ON orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "orders_admin" ON orders FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Products: sellers manage own; all users read active
CREATE POLICY "products_read" ON products FOR SELECT USING (status = 'active' OR seller_id IN (
  SELECT id FROM sellers WHERE user_id = auth.uid()
));
CREATE POLICY "products_seller_write" ON products FOR ALL TO authenticated USING (
  seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
);
CREATE POLICY "products_admin" ON products FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Notifications
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Wallet
CREATE POLICY "wallet_own" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Reviews
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "reviews_own_write" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Sellers
CREATE POLICY "sellers_own" ON sellers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sellers_read" ON sellers FOR SELECT USING (status = 'approved');
CREATE POLICY "sellers_admin" ON sellers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Recently viewed
CREATE POLICY "recently_viewed_own" ON recently_viewed FOR ALL USING (auth.uid() = user_id);

-- Public read tables
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "brands_public_read" ON brands FOR SELECT USING (is_active = TRUE);
CREATE POLICY "banners_public_read" ON banners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "flash_sales_public_read" ON flash_sales FOR SELECT USING (is_active = TRUE);
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT USING (is_active = TRUE);

CREATE POLICY "order_items_customer" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "order_items_seller" ON order_items FOR ALL USING (
  seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
);
CREATE POLICY "order_items_admin" ON order_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "support_tickets_own" ON support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "support_tickets_admin" ON support_tickets FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "support_messages_own" ON support_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_id AND support_tickets.user_id = auth.uid())
);
CREATE POLICY "support_messages_admin" ON support_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "flash_sale_products_read" ON flash_sale_products FOR SELECT USING (TRUE);
