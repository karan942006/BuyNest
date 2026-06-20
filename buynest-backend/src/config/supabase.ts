import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import logger from './logger';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  logger.error('SUPABASE_URL and SUPABASE_ANON_KEY must be provided in environmental variables.');
  process.exit(1);
}

// Client for normal operations (using Anon key, respects RLS)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Admin SDK client (bypasses RLS). If service role key is missing, fall back to anon key and warn.
const adminKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  logger.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations will fallback to Anon key (subject to RLS policies).');
}

export const supabaseAdmin = createClient(env.SUPABASE_URL, adminKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export default supabase;
