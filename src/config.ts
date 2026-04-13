import { createClient } from '@supabase/supabase-js';

export const CONFIG = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE',
    BACKEND_API_URL: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'
};

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
