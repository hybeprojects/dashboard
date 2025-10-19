const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DB_URL',
  'DB_PASSWORD',
  'NEXT_PUBLIC_API_URL',
  'ENV_CHECK_SECRET',
  'NEXT_PUBLIC_SENTRY_DSN',
  'FINERACT_URL',
  'FINERACT_USERNAME',
  'FINERACT_PASSWORD',
  'FINERACT_TENANT_ID',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error('Missing environment variables:', missing.join(', '));
  process.exit(1);
}
console.log('All required environment variables are present');
