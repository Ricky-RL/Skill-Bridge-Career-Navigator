'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import Button from './ui/Button';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then((response) => {
      setUser(response?.data?.session?.user as User | null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as User | null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">SkillBridge</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/roles"
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                Browse Roles
              </Link>
              {user && (
                <>
                  <Link
                    href="/profile"
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={handleSignIn}>Sign in with Google</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
