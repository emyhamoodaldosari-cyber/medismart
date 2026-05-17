import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isPharmacist: boolean;
  isCustomer: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Check initial session on app load
    console.log('[Auth] Checking initial session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[Auth] Error getting session:', error.message);
        setUser(null);
        setLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      
      if (currentUser) {
        console.log('[Auth] ✓ Existing session found for user:', currentUser.id);
        setUser(currentUser);
        fetchProfile(currentUser.id);
      } else {
        console.log('[Auth] No existing session found');
        setLoading(false);
      }
    });

    // Listen for auth state changes (sign in, sign out, refresh)
    console.log('[Auth] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        console.log('[Auth] Auth event:', event, '- User ID:', currentUser.id);
        fetchProfile(currentUser.id);
      } else {
        console.log('[Auth] Auth event:', event, '- Clearing profile');
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('[Auth] Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, []);

  // Realtime subscription for profile updates
  useEffect(() => {
    if (!user?.id) return;

    let channel: any;
    let retryCount = 0;
    const maxRetries = 3;

    const setupSubscription = () => {
      channel = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile change detected:', payload);
            
            if (payload.eventType === 'DELETE') {
              console.warn('Profile deleted for user:', user.id);
              setProfile(null);
              // Try to recreate profile
              setTimeout(() => createProfileForUser(user.id), 1000);
            } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const updatedProfile = payload.new as UserProfile;
              // Validate role before updating
              const validRoles: UserRole[] = ['customer', 'pharmacist', 'admin'];
              if (validRoles.includes(updatedProfile.role)) {
                setProfile(updatedProfile);
                console.log('Profile updated via realtime:', updatedProfile);
              } else {
                console.error('Invalid role in realtime update:', updatedProfile.role);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log(`Realtime subscription status for ${user.id}:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`✓ Profile realtime subscribed: ${user.id}`);
            retryCount = 0; // Reset retry count on success
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`✗ Realtime error for user ${user.id}`);
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying subscription (${retryCount}/${maxRetries})...`);
              setTimeout(setupSubscription, 1000 * retryCount); // Exponential backoff
            } else {
              console.error(`Max retries reached for user ${user.id}. Giving up.`);
            }
          } else if (status === 'TIMED_OUT') {
            console.warn(`Realtime timeout for user ${user.id}, reconnecting...`);
            setupSubscription();
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log(`✓ Profile realtime unsubscribed: ${user.id}`);
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  /**
   * Fetch user profile from database
   * Handles both existing profiles (pharmacist/admin/customer) and newly created ones
   */
  const fetchProfile = async (userId: string) => {
    console.log('[Auth] fetchProfile called for userId:', userId);
    
    try {
      console.log('[Auth] Fetching profile from database...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] Error fetching profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        
        if (error.code === 'PGRST116') {
          // Profile doesn't exist (404)
          console.warn('[Auth] Profile not found for userId:', userId);
          console.log('[Auth] Waiting for potential DB trigger to create profile...');
          
          // Wait for DB trigger to create profile (if configured)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Try fetching again after waiting
          console.log('[Auth] Retrying profile fetch after delay...');
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (retryError || !retryData) {
            console.error('[Auth] Profile still not found after retry:');
            console.error('[Auth]   Code:', retryError?.code);
            console.error('[Auth]   Message:', retryError?.message);
            console.warn('[Auth] ⚠️ User authenticated but profile missing - likely requires manual database setup');
            setProfile(null);
            setLoading(false);
          } else {
            console.log('[Auth] ✓ Profile found on retry:', {
              id: retryData.id,
              role: retryData.role,
              email: retryData.email
            });
            const validRoles: UserRole[] = ['customer', 'pharmacist', 'admin'];
            if (validRoles.includes(retryData.role)) {
              setProfile(retryData as UserProfile);
            } else {
              console.error('[Auth] Invalid role in retried profile:', retryData.role);
              setProfile(null);
            }
            setLoading(false);
          }
        } else if (error.code === '406' || error.message.includes('406')) {
          // 406 Not Acceptable - RLS policy or auth session issue
          console.error('[Auth] 406 Not Acceptable error - RLS policy or session issue');
          
          // Verify session is still valid
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          console.log('[Auth] Session check:', {
            hasSession: !!sessionData.session,
            sessionError: sessionError?.message,
            sessionUserId: sessionData.session?.user.id
          });
          
          if (sessionData.session) {
            // Session is valid but we can't fetch profile due to RLS
            console.warn('[Auth] Session valid but profile fetch blocked by RLS policy');
            setProfile(null);
          } else {
            console.error('[Auth] No valid session found');
            setProfile(null);
          }
          
          setLoading(false);
        } else if (error.code === '401' || error.code === 'PGRST301') {
          // Auth/permission denied
          console.error('[Auth] Authentication required to fetch profile');
          setProfile(null);
          setLoading(false);
        } else {
          // Unknown error
          console.error('[Auth] Unknown profile fetch error, code:', error.code);
          setProfile(null);
          setLoading(false);
        }
      } else if (data) {
        // Validate role is one of the allowed values
        const validRoles: UserRole[] = ['customer', 'pharmacist', 'admin'];
        if (!validRoles.includes(data.role)) {
          console.error('[Auth] ✗ Invalid role in profile:', data.role);
          console.error('[Auth] Valid roles are: customer, pharmacist, admin');
          setProfile(null);
        } else {
          console.log('[Auth] ✓ Profile fetched and validated:', {
            id: data.id,
            email: data.email,
            role: data.role,
            fullName: data.full_name,
            pharmacyId: data.pharmacy_id,
            active: data.is_active
          });
          setProfile(data as UserProfile);
        }
        setLoading(false);
      } else {
        // No error but also no data - shouldn't happen
        console.warn('[Auth] Profile fetch returned no data and no error');
        setProfile(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('[Auth] Exception in fetchProfile:', {
        message: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : typeof err
      });
      setProfile(null);
      setLoading(false);
    }
  };

  /**
   * Create a profile for a user if it doesn't exist
   * SAFETY: This function should only create profiles for NEW users
   * WARNING: Never auto-creates profiles for known seeded users (pharmacist, admin)
   */
  const createProfileForUser = async (userId: string) => {
    console.warn('[Auth] createProfileForUser called for userId:', userId);
    
    try {
      // Get current user info from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[Auth] ✗ Error getting current user:', userError.message);
        return;
      }
      
      if (!user) {
        console.error('[Auth] ✗ No user found in auth session');
        return;
      }
      
      console.log('[Auth] User info from auth:', {
        id: user.id,
        email: user.email,
        confirmed: !!user.confirmed_at
      });
      
      // List of known seeded users that should NOT be auto-created
      // These should have profiles created via database or admin panel
      const seededUsers = [
        'pharmacist@medismart.io',
        'admin@medismart.io'
      ];
      
      if (seededUsers.includes(user.email || '')) {
        console.error('[Auth] ✗ Attempted to auto-create profile for SEEDED user:', user.email);
        console.error('[Auth] ✗ Seeded users (pharmacist, admin) must have profiles created manually');
        console.warn('[Auth] This user has role:', user.user_metadata?.role || 'unknown');
        return;
      }
      
      // Only auto-create profiles for regular customers
      console.log('[Auth] Auto-creating CUSTOMER profile for new user...');
      const userEmail = user.email || `${userId}@placeholder.medismart`;
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: userEmail,
          role: 'customer', // Only customers get auto-created profiles
          preferred_language: 'en',
          is_active: true
        }]);
      
      if (createError) {
        console.error('[Auth] ✗ Error creating customer profile:', {
          code: createError.code,
          message: createError.message,
          hint: createError.hint
        });
        
        // If it's a duplicate key error, profile might already exist
        if (createError.code === '23505') {
          console.log('[Auth] Profile already exists (duplicate key), fetching it...');
          await fetchProfile(userId);
          return;
        }
        
        // If it's a permission error, inform user
        if (createError.code === '42501' || createError.message.includes('permission')) {
          console.error('[Auth] Permission denied to create profile - RLS policy may be blocking');
        }
      } else {
        console.log('[Auth] ✓ Customer profile created successfully for:', userId);
      }
    } catch (err) {
      console.error('[Auth] Exception in createProfileForUser:', {
        message: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : typeof err
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn attempt for:', email);
    
    try {
      console.log('[Auth] Sending signInWithPassword request...');
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('[Auth] signIn error:', {
          code: error.code,
          message: error.message,
          status: error.status,
          fullError: error
        });
        
        // Provide appropriate error messages based on auth error
        if (error.message.includes('Invalid login credentials')) {
          // Supabase returns this for both wrong password and non-existent users
          // We cannot distinguish client-side, so provide generic message
          console.warn('[Auth] Invalid login credentials for:', email);
          throw new Error('Invalid email or password. Please check and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          console.warn('[Auth] Email not confirmed for:', email);
          throw new Error('Please confirm your email address before logging in.');
        } else if (error.message.includes('Too many requests')) {
          console.warn('[Auth] Too many login attempts from:', email);
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        } else if (error.message.includes('Email contains an invalid character')) {
          console.warn('[Auth] Invalid email format:', email);
          throw new Error('Invalid email address format.');
        } else if (error.message.includes('Same password')) {
          console.warn('[Auth] Password same as current:', email);
          throw new Error('New password cannot be the same as current password.');
        }
        
        // Re-throw as-is for unknown error types
        console.error('[Auth] Re-throwing unknown auth error:', error.message);
        throw error;
      }
      
      if (!data.user) {
        console.error('[Auth] signIn returned no user data (user object is null/undefined)');
        throw new Error('Authentication failed: no user data was returned.');
      }
      
      console.log('[Auth] ✓ signIn successful', {
        email: email,
        userId: data.user.id,
        emailConfirmed: !!data.user.confirmed_at,
        sessionExpires: data.session?.expires_at
      });
      
      // Profile will be fetched automatically via onAuthStateChange
    } catch (error: any) {
      console.error('[Auth] signIn exception caught:', {
        message: error?.message,
        code: error?.code,
        type: error?.constructor?.name
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('[Auth] signUp attempt for:', email);
    
    try {
      console.log('[Auth] Creating new user account...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        console.error('[Auth] signUp error:', {
          code: error.code,
          message: error.message
        });
        throw error;
      }
      
      console.log('[Auth] ✓ User account created:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: !!data.user?.confirmed_at,
        sessionCreated: !!data.session
      });
      
      // If user is created but email not confirmed, let user know
      if (data.user && !data.user.confirmed_at) {
        console.log('[Auth] Email confirmation required - confirmation link sent');
      } else if (data.user) {
        console.log('[Auth] User confirmed immediately, ensuring profile exists...');
        // Give a small delay for the database trigger to execute
        setTimeout(() => {
          fetchProfile(data.user!.id);
        }, 1000);
      }
      
      return data;
    } catch (error: any) {
      console.error('[Auth] signUp exception:', error?.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isPharmacist: profile?.role === 'pharmacist',
    isCustomer: profile?.role === 'customer',
    signOut,
    signIn,
    signUp,
    resetPassword,
    updatePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
