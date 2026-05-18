'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getProfile, listAddresses } from '@/services/userService';
import Spinner from '@/components/Spinner';

export default function ProfilePage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      setProfile(await getProfile(user.id));
      setAddresses(await listAddresses(user.id));
      setLoading(false);
    };
    load();
  }, [user]);

  if (authLoading || loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <h1 className="text-3xl font-semibold text-slate-900">My profile</h1>
        <p className="mt-3 text-slate-600">Manage your account details and delivery addresses.</p>
      </section>
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Account details</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-600">Full name</p>
            <p className="mt-1 text-base text-slate-900">{profile?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Email</p>
            <p className="mt-1 text-base text-slate-900">{profile?.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Phone</p>
            <p className="mt-1 text-base text-slate-900">{profile?.phone ?? 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Language</p>
            <p className="mt-1 text-base text-slate-900">{profile?.preferred_language}</p>
          </div>
        </div>
      </section>
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Addresses</h2>
        </div>
        {addresses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No saved addresses yet.</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{address.title}</p>
                <p className="text-sm text-slate-600">{address.city}, {address.district}</p>
                <p className="text-sm text-slate-600">{address.street}</p>
                <p className="text-sm text-slate-600">Building {address.building_no ?? 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
