'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import Button from './ui/Button';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    setShowDropdown(false);
    await supabase.auth.signOut();
  };

  const navTextColor = isHomePage ? 'text-white' : 'text-gray-700';
  const navHoverColor = isHomePage ? 'hover:text-white/80' : 'hover:text-violet-600';
  const logoColor = isHomePage ? 'text-white' : 'text-violet-600';

  return (
    <nav className={isHomePage ? 'fixed top-0 left-0 right-0 z-50' : 'fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm'}>
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
                    href="/dashboard"
                    className={`px-4 py-2 text-sm font-medium ${navTextColor} ${navHoverColor} transition-colors`}
                  >
                    Analyze Role
                  </Link>
                  <Link
                    href="/compare"
                    className={`px-4 py-2 text-sm font-medium ${navTextColor} ${navHoverColor} transition-colors`}
                  >
                    Compare Roles
                  </Link>
                  <Link
                    href="/saved-jobs"
                    className={`px-4 py-2 text-sm font-medium ${navTextColor} ${navHoverColor} transition-colors`}
                  >
                    Saved Jobs
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full border-2 border-white/50 hover:border-violet-400 transition-colors cursor-pointer"
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isHomePage ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'} font-medium`}>
                      {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <svg className={`w-4 h-4 ${navTextColor} transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
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
