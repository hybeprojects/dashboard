const fs = require('fs');
const { Pool } = require('pg');

async function run() {
  const sql = fs.readFileSync(require('path').resolve(__dirname, '../../..', 'infra/supabase_schema.sql'), 'utf8');
  const connection = process.env.POSTGRES_URL || process.env.POSTGRES_HOST;
  if (!connection) {
    console.error('No POSTGRES_URL or POSTGRES_HOST found in environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  const client = await pool.connect();
  try {
    console.log('Running schema...');
    const statements = sql.split(/;\n/).map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`Executing statement ${i+1}/${statements.length}`);
        await client.query(stmt);
      } catch (err) {
        console.error(`Error executing statement ${i+1}:`, err.message);
        console.error('Statement:', stmt.slice(0,200));
        throw err;
      }
    }
    console.log('Schema applied successfully');
  } catch (err) {
    console.error('Error applying schema:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
