import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's way (import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos no arquivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
