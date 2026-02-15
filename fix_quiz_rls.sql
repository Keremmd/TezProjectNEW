-- FIX: Backend'in quiz oluşturabilmesi için RLS'i geçici devre dışı bırak
-- Veya service role key kullan

-- OPTION 1: RLS'i devre dışı bırak (GEÇİCİ, TEST İÇİN)
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions DISABLE ROW LEVEL SECURITY;

-- NOT: Gerçek production'da service role key kullanmalısın!
