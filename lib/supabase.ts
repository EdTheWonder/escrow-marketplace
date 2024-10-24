import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for client-side usage.
 * This client is used in client components for interacting with Supabase.
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
