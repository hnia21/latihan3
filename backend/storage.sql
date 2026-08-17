-- ============================================================
-- STORAGE: Bucket gallery + policies
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Buat bucket gallery (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Hapus policy lama
DROP POLICY IF EXISTS "gallery select" ON storage.objects;
DROP POLICY IF EXISTS "gallery insert" ON storage.objects;
DROP POLICY IF EXISTS "gallery insert auth" ON storage.objects;
DROP POLICY IF EXISTS "gallery delete" ON storage.objects;
DROP POLICY IF EXISTS "gallery delete auth" ON storage.objects;

-- Publik bisa baca gambar
CREATE POLICY "gallery select"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'gallery');

-- Hanya authenticated yang bisa upload
CREATE POLICY "gallery insert auth"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery');

-- Hanya authenticated yang bisa hapus
CREATE POLICY "gallery delete auth"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery');
