import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export function createClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Lazy initialization to avoid build errors
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

type AuthResponse = { data: { session: Session | null }; error: Error | null };
type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

export const supabase = {
  auth: {
    getSession: (): Promise<AuthResponse> => getSupabase().auth.getSession() as Promise<AuthResponse>,
    onAuthStateChange: (callback: AuthStateChangeCallback) =>
      getSupabase().auth.onAuthStateChange(callback),
    signInWithOAuth: (options: { provider: 'google'; options?: { redirectTo?: string } }) =>
      getSupabase().auth.signInWithOAuth(options),
    signOut: () => getSupabase().auth.signOut(),
  },
};
