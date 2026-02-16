-- Community Posts ve Comments için RLS politikalarını düzelt
-- Supabase SQL Editor'da çalıştır: https://supabase.com/dashboard/project/weakxpyxpmqckfnofkrl/sql/new

-- 1. Mevcut INSERT politikalarını kaldır
DROP POLICY IF EXISTS "Authenticated users can insert community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authenticated users can insert community comments" ON public.community_comments;

-- 2. Yeni INSERT politikaları: Giriş yapmış herkes ekleyebilir (user_id kontrolü fonksiyon içinde)
CREATE POLICY "Anyone authenticated can insert community posts"
  ON public.community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can insert community comments"
  ON public.community_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. RPC fonksiyonunu kontrol et ve güncelle (eğer yoksa oluştur)
CREATE OR REPLACE FUNCTION public.insert_community_post(
  p_image_url text,
  p_caption text DEFAULT NULL,
  p_author_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_post_id uuid;
BEGIN
  -- Oturum kontrolü
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Insert (RLS bypass - SECURITY DEFINER)
  INSERT INTO public.community_posts (user_id, image_url, caption, author_name)
  VALUES (v_user_id, p_image_url, p_caption, p_author_name)
  RETURNING id INTO v_post_id;
  
  RETURN v_post_id;
END;
$$;

-- Fonksiyon izinleri
GRANT EXECUTE ON FUNCTION public.insert_community_post(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_community_post(text, text, text) TO anon;

-- 4. Mevcut politikaları kontrol et
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename IN ('community_posts', 'community_comments')
ORDER BY tablename, cmd;
