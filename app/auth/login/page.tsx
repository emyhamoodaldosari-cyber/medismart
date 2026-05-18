'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';

export default function LoginPage() {
  const { signIn, loading, error } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    await signIn(email, password);
  };

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 shadow-lg shadow-slate-200/70">
      <h1 className="text-3xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-3 text-slate-600">Access your pharmacy orders, cart, and messages.</p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pharmacy focus:ring-2 focus:ring-pharmacy/10"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pharmacy focus:ring-2 focus:ring-pharmacy/10"
          />
        </label>
        {(formError || error) && (
          <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">{formError || error}</div>
        )}
        <Button type="submit" className="w-full">{loading ? <Spinner /> : 'Continue'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link className="font-semibold text-pharmacy-dark hover:text-pharmacy" href="/auth/register">
          Create one
        </Link>
      </p>
    </div>
  );
}
