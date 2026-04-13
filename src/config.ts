import { createClient } from '@supabase/supabase-js';

// The ANON/PUBLISHABLE key is safe to expose — Supabase designed it this way.
// Row Level Security (RLS) controls what it can access.
// The SECRET key stays backend-only in api/index.py.
export const CONFIG = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    BACKEND_API_URL: import.meta.env.VITE_BACKEND_API_URL || '/api'
};

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
