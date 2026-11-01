import { expect, test } from '@playwright/test';

test('redirects unauthenticated visitors to the register sign-in', async ({ page }) => {
  await page.goto('/sale');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in to the register' })).toBeVisible();
});

test('staff can sign in and enter the register flow', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Work email').fill('dev@nexora.local');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByRole('link', { name: 'Sale' })).toBeVisible();
});
