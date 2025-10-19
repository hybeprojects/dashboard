import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SERVER_BASE = process.env.TEST_SERVER_BASE || 'http://localhost:5000';
const WEB_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
import { createClient } from '@supabase/supabase-js';
const supabaseTestClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

async function ensureSeed() {
  // Run the seed script to create Alice and Bob
  try {
    execSync('node server/seed.js', { stdio: 'inherit' });
  } catch (e) {
    // continue even if seed prints warnings
    console.warn('Seed script finished with warnings');
  }
}

async function readUsers() {
  try {
    const { data } = await supabaseTestClient.from('app_users').select('*');
    return data || [];
  } catch (e) {
    return [];
  }
}

test.describe('End-to-end transfer flow', () => {
  test.beforeAll(async () => {
    await ensureSeed();
  });

  test('user A logs in, sends money to user B, transaction appears for both', async ({ page }) => {
    const users = await readUsers();
    const alice = users.find((u: any) => u.email === 'alice@example.com');
    const bob = users.find((u: any) => u.email === 'bob@example.com');
    if (!alice || !bob) {
      test.fail(true, 'Seeded users not found in Supabase app_users');
      return;
    }

    const alicePassword = 'password123';

    // Login as Alice
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', alice.email);
    await page.fill('input[type="password"]', alicePassword);
    await Promise.all([
      page.waitForNavigation({ url: `${WEB_BASE}/dashboard` }),
      page.click('button[type="submit"], button:has-text("Sign In")'),
    ]);

    // Wait for dashboard accounts to load
    await page.waitForSelector('text=Accounts', { timeout: 10_000 });

    // Go to Transfer page
    await page.goto(`${WEB_BASE}/transfer`);

    // Fill transfer form
    // Select from the first account; ensure account id strings
    const fromSelect = await page.waitForSelector('select');
    const options = await fromSelect.locator('option').allTextContents();
    if (options.length === 0) {
      test.fail(true, 'No accounts available in From select');
      return;
    }

    // Use Bob's accountId as target (fallback to numeric or string)
    const toAccount = bob.accountId ?? bob.acctId ?? bob.account_id ?? bob.id ?? String(bob.email);

    await page.fill(
      'input[placeholder="To (account id)"], input[name="to"], input[type="text"]',
      String(toAccount),
    );
    await page.fill('input[placeholder="Amount"], input[name="amount"]', '10');

    // Submit
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/transactions') ||
          resp.url().includes('/transfer') ||
          resp.status() < 500,
      ),
      page.click('button:has-text("Send Transfer")'),
    ]);

    // Check for success message in UI
    const success = await page
      .locator('text=Transfer submitted')
      .first()
      .isVisible()
      .catch(() => false);
    expect(success).toBeTruthy();

    // Check Alice's account history page
    const aliceAccountId = alice.accountId ?? alice.accountId;
    await page.goto(`${WEB_BASE}/accounts/${aliceAccountId}`);
    await page.waitForSelector('text=Recent activity', { timeout: 5000 });
    const aliceHasTx = await page
      .locator(`text=Transfer to`)
      .first()
      .isVisible()
      .catch(() => false);
    expect(aliceHasTx).toBeTruthy();

    // Check Bob's account history page
    const bobAccountId = bob.accountId ?? bob.accountId;
    await page.goto(`${WEB_BASE}/accounts/${bobAccountId}`);
    await page.waitForSelector('text=Recent activity', { timeout: 5000 });
    const bobHasTx = await page
      .locator(`text=Transfer to`)
      .first()
      .isVisible()
      .catch(() => false);
    expect(bobHasTx).toBeTruthy();
  });
});
