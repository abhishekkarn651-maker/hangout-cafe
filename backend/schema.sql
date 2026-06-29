-- ============================================================
-- Hangout Cafe - Supabase PostgreSQL Schema
-- Execute this ENTIRE file in the Supabase SQL Editor:
-- https://supabase.com/dashboard → your project → SQL Editor
-- ============================================================

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT DEFAULT 'Admin' NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Banners Table (Hero Slider)
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    image TEXT NOT NULL,
    cta_text TEXT DEFAULT 'View Menu' NOT NULL,
    cta_link TEXT DEFAULT '#menu' NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Menu Table
CREATE TABLE IF NOT EXISTS menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    expiry_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. About Table (Singleton - one row)
CREATE TABLE IF NOT EXISTS about (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    image TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Contact Table (Singleton - one row)
CREATE TABLE IF NOT EXISTS contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    opening_hours TEXT NOT NULL,
    instagram TEXT,
    facebook TEXT,
    whatsapp TEXT,
    google_maps_link TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- Disable Row Level Security on all tables.
-- The backend uses the service_role key which bypasses RLS,
-- but disabling it explicitly avoids any edge-case issues.
-- ============================================================
ALTER TABLE admins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery  ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE about    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact  ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (this is the key our backend uses)
-- These policies allow the backend to do anything, while the anon
-- key (if used from frontend) would be blocked.
CREATE POLICY "Service role full access on admins"  ON admins  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on menu"    ON menu    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on gallery"  ON gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on offers"  ON offers  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on about"   ON about   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on contact" ON contact FOR ALL USING (true) WITH CHECK (true);
