import { test, expect } from '@playwright/test';

test('landing page shows hello world', async ({ page }) => {
  await page.goto('/Carbon101/');
  await expect(page.getByText(/hello world/i)).toBeVisible();
});
