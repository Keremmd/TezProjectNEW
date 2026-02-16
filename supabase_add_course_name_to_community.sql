-- Add course_name column to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS course_name text;

-- Update the insert_community_post RPC function to include course_name
CREATE OR REPLACE FUNCTION public.insert_community_post(
  p_image_url text,
  p_caption text DEFAULT NULL,
  p_author_name text DEFAULT NULL,
  p_course_name text DEFAULT NULL
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Oturum gerekli';
  END IF;
  INSERT INTO public.community_posts (user_id, image_url, caption, author_name, course_name)
  VALUES (v_user_id, p_image_url, p_caption, p_author_name, p_course_name)
  RETURNING id INTO v_post_id;
  RETURN v_post_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.insert_community_post(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_community_post(text, text, text, text) TO anon;
