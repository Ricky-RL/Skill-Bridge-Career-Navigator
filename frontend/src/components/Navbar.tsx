'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import Button from './ui/Button';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

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

  const navTextColor = isHomePage ? 'text-white' : 'text-gray-700';
  const navHoverColor = isHomePage ? 'hover:text-white/80' : 'hover:text-violet-600';
  const logoColor = isHomePage ? 'text-white' : 'text-violet-600';

  return (
    <nav className={isHomePage ? 'absolute top-0 left-0 right-0 z-50' : 'bg-white border-b border-gray-100 shadow-sm'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className={`text-xl font-bold tracking-tight ${logoColor}`}>
                SKILLBRIDGE
              </span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-1">
              <Link
                href="/jobs"
                className={`px-4 py-2 text-sm font-medium ${navTextColor} ${navHoverColor} transition-colors`}
              >
                Jobs & Internships
              </Link>
              {user && (
                <>
                  <Link
                    href="/profile"
                    className={`px-4 py-2 text-sm font-medium ${navTextColor} ${navHoverColor} transition-colors`}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`px-4 py-2 text-sm font-medium ${navTextColor} ${navHoverColor} transition-colors`}
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border-2 border-white/50"
                    />
                  )}
                  <span className={`text-sm font-medium ${navTextColor} hidden sm:inline`}>
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <Button
                  variant={isHomePage ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={handleSignOut}
                  className={isHomePage ? '' : 'text-gray-600 hover:bg-gray-100'}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className={`px-4 py-2 text-sm font-medium ${navTextColor} ${navHoverColor} transition-colors`}
                >
                  Log in
                </button>
                <Button variant="yellow" size="sm" rightIcon onClick={handleSignIn}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
