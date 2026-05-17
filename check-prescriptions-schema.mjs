import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jzkzzdwhbtzfhlhoflsy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6a3p6ZHdoYnR6ZmhsaG9mbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTU3NzcsImV4cCI6MjA5MzgzMTc3N30.-9M3Ud4rumF-7a0OP9bNQnRyn_HEvyxO7IqaWQLGseI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking prescriptions table schema...\n');
  
  // Try different field names
  const fieldTests = ['file_url', 'image_url', 'prescription_url', 'url'];
  
  for (const field of fieldTests) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`id, ${field}`)
        .limit(1);
      
      if (!error) {
        console.log(`✅ Field '${field}' EXISTS in prescriptions table`);
      }
    } catch (err) {
      console.log(`❌ Field '${field}' does NOT exist`);
    }
  }
  
  // Try to get all columns by selecting *
  console.log('\nAttempting to get all columns...');
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log('\nAvailable columns in prescriptions table:');
    console.log(Object.keys(data[0]));
  } else if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('No data in prescriptions table yet');
  }
}

checkSchema();
