-- RLS Policy'leri düzelt

-- Önce mevcut policy'leri sil
DROP POLICY IF EXISTS "Users can insert own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can view own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Anyone can view public PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can update own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can delete own PDFs" ON public.pdfs;

-- Yeni policy'leri oluştur (daha güvenli)

-- INSERT: Kullanıcılar sadece kendi user_id'leri ile insert yapabilir
CREATE POLICY "Users can insert own PDFs"
  ON public.pdfs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT: Kullanıcılar kendi PDF'lerini görebilir
CREATE POLICY "Users can view own PDFs"
  ON public.pdfs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Herkes public PDF'leri görebilir
CREATE POLICY "Anyone can view public PDFs"
  ON public.pdfs FOR SELECT
  TO authenticated
  USING (privacy = 'public');

-- UPDATE: Kullanıcılar sadece kendi PDF'lerini güncelleyebilir
CREATE POLICY "Users can update own PDFs"
  ON public.pdfs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Kullanıcılar sadece kendi PDF'lerini silebilir
CREATE POLICY "Users can delete own PDFs"
  ON public.pdfs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
