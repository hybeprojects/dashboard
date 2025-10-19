const { createClient } = require('@supabase/supabase-js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('./logger');

let supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase service not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
  }
  supabase = createClient(url, key);
  return supabase;
}

// Users (app_users table)
async function getUserBySupabaseId(id) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('app_users')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (error) {
    logger.warn(
      'app_users table query failed, falling back to profiles if available',
      error.message || error,
    );
    // fallback to profiles
    const { data: p, error: e2 } = await sb
      .from('profiles')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (e2) throw e2;
    return p;
  }
  return data;
}

async function getUserByAccountId(accountId) {
  const sb = getSupabase();
  // try app_users first
  let { data, error } = await sb
    .from('app_users')
    .select('*')
    .eq('account_id', String(accountId))
    .limit(1)
    .maybeSingle();
  if (error) {
    logger.warn('app_users query failed, trying profiles', error.message || error);
    const { data: p, error: e2 } = await sb
      .from('profiles')
      .select('*')
      .or(`fineract_client_id.eq.${accountId},fineract_account_id.eq.${accountId}`)
      .limit(1)
      .maybeSingle();
    if (e2) throw e2;
    return p;
  }
  return data;
}

async function upsertAppUser(record) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('app_users')
    .upsert(record, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Transactions
async function addTransaction(tx) {
  const sb = getSupabase();
  const { data, error } = await sb.from('transactions').insert(tx).select().maybeSingle();
  if (error) throw error;
  return data;
}
async function listTransactionsForUser(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('transactions')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
async function updateTransactionById(id, patch) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('transactions')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Notifications
async function listNotificationsForUser(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
async function markNotificationsRead(userId, ids) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .in('id', ids)
    .select();
  if (error) throw error;
  return data;
}

// KYC submissions
async function insertKycSubmission(sub) {
  const sb = getSupabase();
  const { data, error } = await sb.from('kyc_submissions').insert(sub).select().maybeSingle();
  if (error) throw error;
  return data;
}
async function listKycSubmissions({ limit = 50, offset = 0 } = {}) {
  const sb = getSupabase();
  const from = offset;
  const to = offset + limit - 1;
  const { data, error } = await sb
    .from('kyc_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return data || [];
}
async function getKycSubmissionBySubmissionId(submissionId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('kyc_submissions')
    .select('*')
    .eq('submission_id', submissionId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
async function updateKycSubmissionBySubmissionId(submissionId, patch) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('kyc_submissions')
    .update(patch)
    .eq('submission_id', submissionId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = {
  getUserBySupabaseId,
  getUserByAccountId,
  upsertAppUser,
  addTransaction,
  listTransactionsForUser,
  updateTransactionById,
  listNotificationsForUser,
  markNotificationsRead,
  insertKycSubmission,
  listKycSubmissions,
  getKycSubmissionBySubmissionId,
  updateKycSubmissionBySubmissionId,
};
