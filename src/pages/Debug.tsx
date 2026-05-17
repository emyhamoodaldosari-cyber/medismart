import React, { useState } from 'react';
import { debugSupabaseConnection, fix406Error, getDetailedErrorInfo } from '../utils/supabase-debug';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DebugPage: React.FC = () => {
  const [debugOutput, setDebugOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const addToOutput = (message: string) => {
    setDebugOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDebug = async () => {
    setLoading(true);
    setDebugOutput([]);
    
    // Capture console.log during debug
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      originalLog(...args);
      addToOutput(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
    };
    
    console.error = (...args) => {
      originalError(...args);
      addToOutput(`❌ ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      addToOutput(`⚠️ ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`);
    };
    
    try {
      addToOutput('🚀 Starting Supabase Debug...');
      await debugSupabaseConnection();
      addToOutput('✅ Debug completed');
    } catch (error) {
      addToOutput(`❌ Debug error: ${error}`);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setLoading(false);
    }
  };

  const runFix = async () => {
    setLoading(true);
    addToOutput('🔧 Attempting to fix 406 errors...');
    
    const success = await fix406Error();
    
    if (success) {
      addToOutput('✅ Fix attempted successfully');
    } else {
      addToOutput('❌ Fix attempt failed');
    }
    
    setLoading(false);
  };

  const testProfileFetch = async () => {
    if (!user) {
      addToOutput('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    addToOutput(`🔍 Testing profile fetch for user: ${user.id}`);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        const errorInfo = getDetailedErrorInfo(error);
        addToOutput(`❌ Profile fetch error: ${JSON.stringify(errorInfo, null, 2)}`);
        
        if (errorInfo.is406) {
          addToOutput('⚠️ 406 Error detected! This is likely an RLS policy issue.');
          addToOutput('Possible solutions:');
          addToOutput('1. Check RLS policies in Supabase dashboard');
          addToOutput('2. Verify user has permission to access profiles table');
          addToOutput('3. Check authentication session');
        }
      } else {
        addToOutput(`✅ Profile fetch successful: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      addToOutput(`❌ Exception: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearOutput = () => {
    setDebugOutput([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Supabase Debug Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Current State:</h3>
        <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
        <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
        <p><strong>Profile:</strong> {profile ? 'Loaded' : 'Not loaded'}</p>
        <p><strong>Profile Role:</strong> {profile?.role || 'N/A'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runDebug} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {loading ? 'Running...' : 'Run Debug'}
        </button>
        
        <button 
          onClick={runFix} 
          disabled={loading || !user}
          style={{ marginRight: '10px', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Fix 406 Errors
        </button>
        
        <button 
          onClick={testProfileFetch} 
          disabled={loading || !user}
          style={{ marginRight: '10px', padding: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Test Profile Fetch
        </button>
        
        <button 
          onClick={clearOutput}
          style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Clear Output
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Debug Output:</h3>
        <div style={{ 
          backgroundColor: '#1e1e1e', 
          color: '#d4d4d4', 
          padding: '15px', 
          borderRadius: '5px', 
          maxHeight: '500px', 
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {debugOutput.length === 0 ? (
            <div style={{ color: '#888' }}>No output yet. Click "Run Debug" to start.</div>
          ) : (
            debugOutput.map((line, index) => (
              <div key={index} style={{ marginBottom: '5px', whiteSpace: 'pre-wrap' }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>Common 406 Error Solutions:</h3>
        <ol>
          <li><strong>Check RLS Policies:</strong> Ensure profiles table has proper RLS policies</li>
          <li><strong>Verify Authentication:</strong> Make sure user is properly authenticated</li>
          <li><strong>Check Headers:</strong> Ensure Accept and Content-Type headers are set</li>
          <li><strong>Profile Existence:</strong> Verify profile exists in database</li>
          <li><strong>Database Triggers:</strong> Check if handle_new_user() trigger is working</li>
        </ol>
        
        <h4>Quick SQL Fixes:</h4>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '3px' }}>
{`-- Check if profile exists
SELECT * FROM public.profiles WHERE id = 'YOUR_USER_ID';

-- Create profile if missing
INSERT INTO public.profiles (id, full_name, email, role, preferred_language, is_active)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  email,
  'customer',
  'en',
  true
FROM auth.users 
WHERE id = 'YOUR_USER_ID'
ON CONFLICT (id) DO NOTHING;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';`}
        </pre>
      </div>
    </div>
  );
};

export default DebugPage;