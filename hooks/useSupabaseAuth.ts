'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadProfile = async (userId: string) => {
    const { data, error: fetchError } = await supabase.from('users').select('*').eq('id', userId).single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      setError(fetchError.message);
      setUser(null);
      return;
    }
    setUser(data ?? null);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    init();

    const authListener = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.data?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return null;
    }
    if (data?.user) {
      await loadProfile(data.user.id);
      router.push('/medicines');
    }
    setLoading(false);
    return data;
  };

  const signUp = async (full_name: string, email: string, password: string, phone?: string) => {
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return null;
    }

    if (data?.user) {
      const profilePayload = {
        id: data.user.id,
        full_name,
        email,
        phone,
        role: 'customer',
        preferred_language: 'ar',
        is_active: true,
      };
      const { error: profileError } = await supabase.from('users').insert(profilePayload);
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return null;
      }
      await loadProfile(data.user.id);
      router.push('/medicines');
    }

    setLoading(false);
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError.message);
    }
    setUser(null);
    setLoading(false);
    router.push('/auth/login');
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
}
