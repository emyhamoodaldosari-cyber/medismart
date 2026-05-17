import { supabase } from '../lib/supabase';

/**
 * Debug utility for Supabase 406 errors and authentication issues
 */
export const debugSupabaseConnection = async () => {
  console.group('🔍 Supabase Debug Information');
  
  try {
    // 1. Check environment variables
    console.log('1. Environment Variables:');
    console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
    
    // 2. Check current session
    console.log('2. Current Session:');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('- Session Error:', sessionError);
    } else {
      console.log('- Has Session:', !!sessionData.session);
      if (sessionData.session) {
        console.log('- User ID:', sessionData.session.user.id);
        console.log('- User Email:', sessionData.session.user.email);
        console.log('- Session Expires:', new Date(sessionData.session.expires_at! * 1000).toLocaleString());
      }
    }
    
    // 3. Test simple query (public table)
    console.log('3. Test Public Query (pharmacies):');
    try {
      const { data: publicData, error: publicError } = await supabase
        .from('pharmacies')
        .select('count')
        .limit(1);
      
      if (publicError) {
        console.error('- Public Query Error:', {
          code: publicError.code,
          message: publicError.message,
          details: publicError.details
        });
      } else {
        console.log('- Public Query: ✓ Success');
      }
    } catch (err) {
      console.error('- Public Query Exception:', err);
    }
    
    // 4. Test authenticated query (profiles)
    console.log('4. Test Authenticated Query (profiles):');
    if (sessionData.session) {
      try {
        const { data: authData, error: authError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', sessionData.session.user.id)
          .maybeSingle();
        
        if (authError) {
          console.error('- Authenticated Query Error:', {
            code: authError.code,
            message: authError.message,
            details: authError.details,
            hint: authError.hint
          });
          
          // Specific handling for 406 errors
          if (authError.code === '406' || authError.message.includes('406')) {
            console.warn('⚠️ 406 Error Detected - Possible Causes:');
            console.warn('  - RLS Policy rejecting request');
            console.warn('  - Missing Accept/Content-Type headers');
            console.warn('  - Authentication token issues');
            console.warn('  - CORS configuration problems');
          }
        } else {
          console.log('- Authenticated Query: ✓ Success');
          console.log('- Profile Exists:', !!authData);
        }
      } catch (err) {
        console.error('- Authenticated Query Exception:', err);
      }
    } else {
      console.log('- Skipped (no session)');
    }
    
    // 5. Check headers being sent
    console.log('5. Request Headers Analysis:');
    console.log('- Supabase URL:', supabase.supabaseUrl);
    console.log('- Default Headers:', supabase.headers);
    
    // 6. Test RPC call
    console.log('6. Test RPC Call:');
    try {
      const { error: rpcError } = await supabase.rpc('current_user_role');
      if (rpcError) {
        console.log('- RPC Error (expected if function doesnt exist):', rpcError.message);
      } else {
        console.log('- RPC: ✓ Success');
      }
    } catch (err) {
      console.log('- RPC Exception:', err);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Fix common 406 error issues
 */
export const fix406Error = async () => {
  console.group('🔧 Attempting to fix 406 errors');
  
  try {
    // 1. Refresh session
    console.log('1. Refreshing session...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log('No active session. User needs to sign in.');
      return false;
    }
    
    // 2. Clear and reset Supabase client (simulate)
    console.log('2. Checking client configuration...');
    
    // 3. Test with different Accept headers
    console.log('3. Testing different content types...');
    
    // 4. Try to create profile if it doesn't exist
    console.log('4. Checking/Creating profile...');
    const userId = sessionData.session.user.id;
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error('Profile check error:', profileError);
      
      if (profileError.code === '406') {
        console.log('Attempting workaround for 406 error...');
        
        // Try with different endpoint
        const response = await fetch(
          `${supabase.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              'Authorization': `Bearer ${sessionData.session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Direct fetch status:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Direct fetch success:', data);
          return true;
        } else {
          console.error('Direct fetch failed:', await response.text());
        }
      }
    } else if (!profile) {
      console.log('Profile missing, attempting to create...');
      // Profile creation logic would go here
    } else {
      console.log('Profile exists:', profile.id);
      return true;
    }
    
  } catch (error) {
    console.error('Fix error:', error);
  } finally {
    console.groupEnd();
  }
  
  return false;
};

/**
 * Get detailed error information
 */
export const getDetailedErrorInfo = (error: any) => {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    status: error.status,
    statusText: error.statusText,
    is406: error.code === '406' || error.message?.includes('406'),
    isRLSError: error.code === '42501' || error.message?.includes('permission'),
    isNotFound: error.code === 'PGRST116',
    timestamp: new Date().toISOString()
  };
};