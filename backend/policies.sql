-- ============================================================
-- RLS POLICIES: Keamanan data
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ====== PROFILE ======
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profile" ON profile;
DROP POLICY IF EXISTS "Auth insert profile" ON profile;
DROP POLICY IF EXISTS "Auth update profile" ON profile;

CREATE POLICY "Public read profile" ON profile FOR SELECT TO anon USING (true);
CREATE POLICY "Auth insert profile" ON profile FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update profile" ON profile FOR UPDATE TO authenticated USING (true);

-- ====== GALLERY ======
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read gallery" ON gallery;
DROP POLICY IF EXISTS "Auth insert gallery" ON gallery;
DROP POLICY IF EXISTS "Auth delete gallery" ON gallery;

CREATE POLICY "Public read gallery" ON gallery FOR SELECT TO anon USING (true);
CREATE POLICY "Auth insert gallery" ON gallery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth delete gallery" ON gallery FOR DELETE TO authenticated USING (true);

-- ====== ARTICLES ======
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read articles" ON articles;
DROP POLICY IF EXISTS "Auth insert articles" ON articles;
DROP POLICY IF EXISTS "Auth update articles" ON articles;
DROP POLICY IF EXISTS "Auth delete articles" ON articles;

CREATE POLICY "Public read articles" ON articles FOR SELECT TO anon USING (true);
CREATE POLICY "Auth insert articles" ON articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update articles" ON articles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete articles" ON articles FOR DELETE TO authenticated USING (true);

-- ====== KARYA ======
ALTER TABLE karya ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read karya" ON karya;
DROP POLICY IF EXISTS "Auth insert karya" ON karya;
DROP POLICY IF EXISTS "Auth update karya" ON karya;
DROP POLICY IF EXISTS "Auth delete karya" ON karya;

CREATE POLICY "Public read karya" ON karya FOR SELECT TO anon USING (true);
CREATE POLICY "Auth insert karya" ON karya FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update karya" ON karya FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete karya" ON karya FOR DELETE TO authenticated USING (true);
