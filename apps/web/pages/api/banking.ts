import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import {
  getServiceRoleClient,
  createClientForRequest,
  parseTokenFromReq,
} from '../../lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userSupabase = createClientForRequest(req);
    if (!userSupabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data: userData, error: userErr } = await userSupabase.auth.getUser();
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = userData.user;

    const serviceSupabase = getServiceRoleClient();
    if (!serviceSupabase)
      return res.status(500).json({ error: 'Supabase service client not configured' });

    // Lookup fineract_client_id from profiles (existing code uses profiles.id === user.id)
    const { data: profile, error: profileErr } = await serviceSupabase
      .from('profiles')
      .select('fineract_client_id')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile?.fineract_client_id) {
      return res.status(404).json({ error: 'No banking profile found' });
    }

    const clientId = profile.fineract_client_id;
    const fineractUrl = (process.env.FINERACT_URL || '').replace(/\/$/, '');
    const username = process.env.FINERACT_USERNAME;
    const password = process.env.FINERACT_PASSWORD;
    const tenant = process.env.FINERACT_TENANT_ID || process.env.FINERACT_TENANT;

    if (!fineractUrl || !username || !password) {
      return res.status(500).json({ error: 'Fineract not configured' });
    }

    const axiosConfig: any = { auth: { username, password }, headers: {}, timeout: 10000 };
    if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

    // Fetch accounts (primary source of truth in this app)
    let accounts: any = null;
    try {
      const r = await axios.get(`${fineractUrl}/clients/${clientId}/accounts`, axiosConfig);
      accounts = r?.data || null;

      // Optionally persist snapshot to Supabase accounts table for fast reads
      try {
        await serviceSupabase
          .from('accounts')
          .upsert({ user_id: user.id, data: accounts }, { onConflict: 'user_id' });
      } catch (e) {
        // ignore persistence errors
        console.warn(
          'Failed to persist accounts snapshot',
          e && (e as any).message ? (e as any).message : e,
        );
      }
    } catch (e) {
      // If fetching accounts failed, try to return cached snapshot from Supabase
      console.warn(
        'Failed to fetch accounts from Fineract',
        e && (e as any).message ? (e as any).message : e,
      );
      try {
        const { data: cached } = await serviceSupabase
          .from('accounts')
          .select('data')
          .eq('user_id', user.id)
          .single();
        accounts = cached?.data || [];
      } catch (e2) {
        accounts = [];
      }
    }

    // Compute balances map from accounts
    const balances: Record<string, number> = {};
    if (Array.isArray(accounts)) {
      accounts.forEach((a: any) => {
        const id =
          a?.id ||
          a?.accountId ||
          a?.resourceId ||
          String(a?.account_number || '') ||
          '__unknown__';
        const bal = a?.balance ?? a?.currentBalance ?? a?.availableBalance ?? a?.amount ?? 0;
        const num = typeof bal === 'string' ? Number(bal) : typeof bal === 'number' ? bal : 0;
        balances[id] = isNaN(num) ? 0 : num;
      });
    }

    // Try to fetch transactions if Fineract supports it (best-effort)
    let transactions: any[] = [];
    try {
      // Common endpoints vary; try clients/{id}/transactions first
      const txUrl1 = `${fineractUrl}/clients/${clientId}/transactions`;
      const txRes = await axios.get(txUrl1, axiosConfig);
      transactions = Array.isArray(txRes?.data) ? txRes.data : txRes?.data?.pageItems || [];
    } catch (e) {
      // fallback: no transactions endpoint or failed
      transactions = [];
    }

    return res.status(200).json({ accounts, balances, transactions });
  } catch (e) {
    console.error('Banking API fatal error', e && (e as any).message ? (e as any).message : e);
    return res.status(500).json({ error: 'Failed to fetch banking data' });
  }
}
