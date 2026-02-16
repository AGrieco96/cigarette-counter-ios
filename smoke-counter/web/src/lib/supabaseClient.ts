import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function normalizeSupabaseProjectUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);

  // Supabase JS si aspetta il project URL, ad esempio:
  // https://<project-ref>.supabase.co
  // Se viene passato un endpoint API (/auth/v1, /rest/v1, ...), il client costruisce
  // URL errati e le chiamate auth possono rispondere 404.
  return parsed.origin;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(normalizeSupabaseProjectUrl(supabaseUrl), supabaseAnonKey);
