import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const isSupabaseConfigured = /^https?:\/\//.test(url) && !!key;

// A non-networking local placeholder keeps the setup message renderable without credentials.
export const supabase = createClient<Database>(
  isSupabaseConfigured ? url : 'http://127.0.0.1:54321',
  isSupabaseConfigured ? key : 'unconfigured-development-key',
  { auth: {
    storage: localStorage,
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    flowType: 'pkce',
    detectSessionInUrl: isSupabaseConfigured,
  } },
);
