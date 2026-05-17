import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jzkzzdwhbtzfhlhoflsy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6a3p6ZHdoYnR6ZmhsaG9mbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTU3NzcsImV4cCI6MjA5MzgzMTc3N30.-9M3Ud4rumF-7a0OP9bNQnRyn_HEvyxO7IqaWQLGseI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 SCHEMA ALIGNMENT VERIFICATION TEST\n');
console.log('=' .repeat(60));

async function runTests() {
  let passCount = 0;
  let failCount = 0;

  // Test 1: Connection
  console.log('\n📡 Test 1: Supabase Connection');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ PASS: Connected to Supabase');
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 2: Profiles table exists
  console.log('\n👤 Test 2: Profiles Table');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, pharmacy_id, created_at')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Profiles table accessible');
    console.log(`   Found ${data?.length || 0} profile(s)`);
    if (data && data.length > 0) {
      console.log(`   Sample: ${data[0].full_name} (${data[0].role})`);
    }
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 3: Pharmacies table
  console.log('\n🏥 Test 3: Pharmacies Table');
  try {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, name, city, is_active, delivery_available')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Pharmacies table accessible');
    console.log(`   Found ${data?.length || 0} pharmacy(ies)`);
    if (data && data.length > 0) {
      console.log(`   Sample: ${data[0].name} in ${data[0].city}`);
    }
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 4: Medicines table
  console.log('\n💊 Test 4: Medicines Table');
  try {
    const { data, error } = await supabase
      .from('medicines')
      .select('id, brand_name, generic_name, requires_prescription, is_active')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Medicines table accessible');
    console.log(`   Found ${data?.length || 0} medicine(s)`);
    if (data && data.length > 0) {
      console.log(`   Sample: ${data[0].brand_name} (${data[0].generic_name})`);
    }
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 5: Pharmacy Inventory table
  console.log('\n📦 Test 5: Pharmacy Inventory Table');
  try {
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select('id, pharmacy_id, medicine_id, quantity, price, in_stock')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Pharmacy inventory table accessible');
    console.log(`   Found ${data?.length || 0} inventory item(s)`);
    if (data && data.length > 0) {
      console.log(`   Sample: Qty ${data[0].quantity}, Price ${data[0].price} SAR`);
    }
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 6: User Addresses table
  console.log('\n📍 Test 6: User Addresses Table');
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('id, user_id, title, city, district, is_default')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: User addresses table accessible');
    console.log(`   Found ${data?.length || 0} address(es)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 7: Carts table
  console.log('\n🛒 Test 7: Carts Table');
  try {
    const { data, error } = await supabase
      .from('carts')
      .select('id, user_id, pharmacy_id, created_at')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Carts table accessible');
    console.log(`   Found ${data?.length || 0} cart(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 8: Cart Items table
  console.log('\n🛍️  Test 8: Cart Items Table');
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, cart_id, medicine_id, quantity, unit_price')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Cart items table accessible');
    console.log(`   Found ${data?.length || 0} cart item(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 9: Orders table
  console.log('\n📋 Test 9: Orders Table');
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, user_id, pharmacy_id, status, order_type, total_amount')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Orders table accessible');
    console.log(`   Found ${data?.length || 0} order(s)`);
    if (data && data.length > 0) {
      console.log(`   Sample: ${data[0].order_number} - ${data[0].status} (${data[0].total_amount} SAR)`);
    }
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 10: Order Items table
  console.log('\n📦 Test 10: Order Items Table');
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('id, order_id, medicine_id, quantity, unit_price, total_price')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Order items table accessible');
    console.log(`   Found ${data?.length || 0} order item(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 11: Prescriptions table
  console.log('\n📄 Test 11: Prescriptions Table');
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, user_id, file_url, status, created_at')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Prescriptions table accessible');
    console.log(`   Found ${data?.length || 0} prescription(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 12: Chats table
  console.log('\n💬 Test 12: Chats Table');
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('id, user_id, pharmacy_id, status')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Chats table accessible');
    console.log(`   Found ${data?.length || 0} chat(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 13: Chat Messages table
  console.log('\n💭 Test 13: Chat Messages Table');
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, chat_id, sender_user_id, message, is_read')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Chat messages table accessible');
    console.log(`   Found ${data?.length || 0} message(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 14: Notifications table
  console.log('\n🔔 Test 14: Notifications Table');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, type, is_read')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Notifications table accessible');
    console.log(`   Found ${data?.length || 0} notification(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 15: Saved Medicines table
  console.log('\n❤️  Test 15: Saved Medicines Table');
  try {
    const { data, error } = await supabase
      .from('saved_medicines')
      .select('id, user_id, medicine_id')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Saved medicines table accessible');
    console.log(`   Found ${data?.length || 0} saved medicine(s)`);
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Test 16: Foreign Key Relationship (inventory with medicine)
  console.log('\n🔗 Test 16: Foreign Key Relationships');
  try {
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        id,
        quantity,
        price,
        medicine:medicines(brand_name, generic_name),
        pharmacy:pharmacies(name, city)
      `)
      .limit(1);
    
    if (error) throw error;
    console.log('✅ PASS: Foreign key relationships working');
    if (data && data.length > 0 && data[0].medicine && data[0].pharmacy) {
      console.log(`   Sample: ${data[0].medicine.brand_name} at ${data[0].pharmacy.name}`);
    }
    passCount++;
  } catch (err) {
    console.log('❌ FAIL:', err.message);
    failCount++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Schema is fully aligned.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
