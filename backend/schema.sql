-- ============================================================
-- SCHEMA: Tabel untuk hnia.my.id
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Profile
CREATE TABLE IF NOT EXISTS profile (
  id BIGSERIAL PRIMARY KEY,
  initials TEXT NOT NULL DEFAULT 'ZP',
  name TEXT NOT NULL DEFAULT 'Nama Anda',
  role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  email TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  body TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Karya
CREATE TABLE IF NOT EXISTS karya (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  link TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
