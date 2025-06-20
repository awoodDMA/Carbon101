import { test, expect } from '@playwright/test';

// Landing -> project -> compare flow

test('user can navigate from landing to project to compare', async ({ page }) => {
  await page.goto('/');

  const firstEnter = page.getByRole('link', { name: /enter/i }).first();
  await firstEnter.click();

  await expect(page).toHaveURL(/\/projects\//);

  const compareLink = page.getByRole('link', { name: /compare/i }).first();
  await compareLink.click();

  await expect(page).toHaveURL(/\/compare/);
  await expect(page.getByText(/tCO2e/)).toBeVisible();
});
