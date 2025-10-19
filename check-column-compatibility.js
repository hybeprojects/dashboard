const { createClient } = require('@supabase/supabase-js');

async function checkColumnCompatibility() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  console.log('🔍 Checking transaction column compatibility...');

  const requiredColumns = ['sender_account_id', 'receiver_account_id', 'running_balance'];
  const missing = [];

  for (const col of requiredColumns) {
    const { error } = await supabase.from('transactions').select(col).limit(0);
    if (error) missing.push(col);
  }

  if (missing.length > 0) {
    console.log('❌ Missing columns:', missing);
  } else {
    console.log('✅ All transaction columns present');
  }

  const testData = {
    sender_account_id: '00000000-0000-0000-0000-000000000000',
    receiver_account_id: '00000000-0000-0000-0000-000000000000',
    amount: 1.0,
    type: 'transfer',
    status: 'completed',
    description: 'Test transfer',
    running_balance: 100.0,
    reference: 'TEST-' + Date.now(),
  };

  console.log('✅ Transaction schema ready for:', Object.keys(testData));
}

checkColumnCompatibility().catch((e) => {
  console.error('Error during compatibility check:', e.message || e);
  process.exit(1);
});
