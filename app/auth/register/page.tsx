'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';

export default function RegisterPage() {
  const { signUp, loading, error } = useSupabaseAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!fullName || !email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    await signUp(fullName, email, password, phone || undefined);
  };

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 shadow-lg shadow-slate-200/70">
      <h1 className="text-3xl font-semibold text-slate-900">Create account</h1>
      <p className="mt-3 text-slate-600">Register as a customer to browse medicines and place orders.</p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pharmacy focus:ring-2 focus:ring-pharmacy/10"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pharmacy focus:ring-2 focus:ring-pharmacy/10"
          />
        </label>
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
        <Button type="submit" className="w-full">{loading ? <Spinner /> : 'Create account'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-semibold text-pharmacy-dark hover:text-pharmacy" href="/auth/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
