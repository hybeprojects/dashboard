const { createClient } = require('@supabase/supabase-js');

async function checkCompatibility() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  console.log('🔍 Checking Supabase Schema Compatibility...');

  // Check if tables exist
  const tables = ['profiles', 'accounts', 'transactions', 'cards', 'transfers'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      console.log(`❌ Table ${table}: MISSING - ${error.message}`);
    } else {
      console.log(`✅ Table ${table}: EXISTS`);
    }
  }
}

checkCompatibility();
