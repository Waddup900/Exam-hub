import { createClient } from '@supabase/supabase-js';

// These come from your Netlify env vars (VITE_ prefix required by Vite).
// Only ever use the ANON key on the frontend — never the service_role key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
