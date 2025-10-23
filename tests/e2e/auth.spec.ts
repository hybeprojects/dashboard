import { test, expect } from '@playwright/test';

const WEB_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Authentication', () => {
  test('login page should load', async ({ page }) => {
    await page.goto(`${WEB_BASE}/login`);
    await expect(page.locator('h2')).toHaveText('Sign in to your account');
  });
});
