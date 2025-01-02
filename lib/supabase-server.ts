import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side usage.
 * Ensures that cookies are correctly passed to handle authentication.
 */
export function createServerSupabase() {
  return createServerComponentClient({ cookies });
}
