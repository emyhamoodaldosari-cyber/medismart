'use client';

import Link from 'next/link';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function NavBar() {
  const { user, signOut } = useSupabaseAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-pharmacy-dark">
          MediSmart
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-700">
          {user ? (
            <>
              <Link href="/medicines" className="px-3 py-2 hover:text-pharmacy-dark transition">
                Medicines
              </Link>
              <Link href="/cart" className="px-3 py-2 hover:text-pharmacy-dark transition">
                Cart
              </Link>
              <Link href="/orders" className="px-3 py-2 hover:text-pharmacy-dark transition">
                Orders
              </Link>
              <Link href="/chat" className="px-3 py-2 hover:text-pharmacy-dark transition">
                Chat
              </Link>
              <Link href="/profile" className="px-3 py-2 hover:text-pharmacy-dark transition">
                Profile
              </Link>
              <button onClick={signOut} className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition hover:bg-slate-200">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-4 py-2 text-slate-700 hover:text-pharmacy-dark transition font-medium">
                Login
              </Link>
              <Link href="/auth/register" className="rounded-full bg-pharmacy text-white px-6 py-2 transition hover:bg-pharmacy-dark font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
