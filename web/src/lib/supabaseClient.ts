import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.debug('[auth][config] raw env check', {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  rawSupabaseUrl: supabaseUrl
});

function normalizeSupabaseProjectUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  console.debug('[auth][config] parsed Supabase URL', {
    origin: parsed.origin,
    pathname: parsed.pathname,
    href: parsed.href
  });
  return parsed.origin;
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[auth][config] missing env vars', { supabaseUrl, hasAnonKey: Boolean(supabaseAnonKey) });
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

const normalizedSupabaseUrl = normalizeSupabaseProjectUrl(supabaseUrl);

console.debug('[auth][config] Supabase URL ready', {
  normalizedSupabaseUrl,
  envMode: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL
});

export const supabase = createClient(normalizedSupabaseUrl, supabaseAnonKey);
