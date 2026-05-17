import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jzkzzdwhbtzfhlhoflsy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6a3p6ZHdoYnR6ZmhsaG9mbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTU3NzcsImV4cCI6MjA5MzgzMTc3N30.-9M3Ud4rumF-7a0OP9bNQnRyn_HEvyxO7IqaWQLGseI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      return;
    }
    
    console.log('✅ Supabase connected successfully!');
    console.log('Session:', data.session ? 'Active' : 'No active session');
    
    // Test database connection
    const { data: tables, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (dbError && dbError.code === '42P01') {
      console.log('⚠️  profiles table does not exist yet. Run the SQL setup.');
    } else if (dbError) {
      console.log('⚠️  Database error:', dbError.message);
    } else {
      console.log('✅ Database connection successful!');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
