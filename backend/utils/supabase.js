import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Backend Supabase client.
 *
 * Prefers SUPABASE_SERVICE_ROLE_KEY when available so server-side writes
 * (e.g. caching mindmaps) can bypass Row Level Security. Falls back to the
 * anon key so local dev still works, but then RLS applies — in that case
 * writes to tables whose policies require auth.uid() will fail.
 *
 * Get the service role key from:
 *   Supabase Dashboard → Project settings → API → "service_role" key
 * Add it to backend/.env as SUPABASE_SERVICE_ROLE_KEY=...
 */
const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

if (SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔐 Supabase client: using SERVICE_ROLE key (RLS bypassed)');
} else {
  console.warn(
    '⚠️ Supabase client: using ANON key (RLS applies). ' +
      'Set SUPABASE_SERVICE_ROLE_KEY in backend/.env for server writes.'
  );
}

export const supabase = createClient(SUPABASE_URL, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
