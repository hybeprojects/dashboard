// Supabase shim removed. Returning null to indicate service client is not configured.
export default function getServerSupabase() {
  console.warn('getServerSupabase called but Supabase integration has been removed.');
  return null;
}
