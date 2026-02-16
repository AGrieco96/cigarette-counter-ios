import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function normalizeSupabaseProjectUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  return parsed.origin;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

const normalizedSupabaseUrl = normalizeSupabaseProjectUrl(supabaseUrl);

console.info('[auth] Supabase client diagnostics:', {
  rawSupabaseUrl: supabaseUrl,
  normalizedSupabaseUrl,
  anonKeyLength: supabaseAnonKey.length
});

export const supabase = createClient(normalizedSupabaseUrl, supabaseAnonKey);
