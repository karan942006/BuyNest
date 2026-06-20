import { createClient } from '@supabase/supabase-js';

// Uses environment variables (set in .env.local for dev, Vercel env vars for prod)
// Fallback to existing project values so the app works out-of-the-box
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://huavhlrmjelegvipjgdv.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YXZobHJtamVsZWd2aXBqZ2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDE4NzIsImV4cCI6MjA5NjYxNzg3Mn0.8aB5HWb0aqcIuiv3Sqca0LLrH-UAYSSliCVKaEh1zcI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;
