import { expect, test, type Page } from '@playwright/test';

const REGISTER_ID = '11111111-1111-1111-1111-111111111111';
const FAKE_REGISTER = {
  id: REGISTER_ID,
  branchId: '22222222-2222-2222-2222-222222222222',
  stockLocationId: '33333333-3333-3333-3333-333333333333',
  registerCode: 'E2E-01',
  name: 'E2E Register',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Work email').fill('dev@nexora.local');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function useMockedRegister(page: Page) {
  await page.addInitScript(([key, id]) => window.localStorage.setItem(key, id), [
    'nexora.pos.registerId',
    REGISTER_ID,
  ] as const);
  await page.route('**/api/v1/pos/registers**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([FAKE_REGISTER]),
    }),
  );
}

test('transactions status filter uses the shadcn select', async ({ page }) => {
  await signIn(page);
  await page.goto('/transactions');

  const filter = page.getByRole('combobox', { name: 'Filter by status' });
  await expect(filter).toBeVisible();
  await filter.click();
  await page.getByRole('option', { name: 'Posted' }).click();
  await expect(filter).toContainText('Posted');
});

test('sale tender method uses the shadcn select', async ({ page }) => {
  await useMockedRegister(page);
  await signIn(page);
  await expect(page).toHaveURL(/\/sale$/);

  const tender = page.getByRole('combobox', { name: 'Tender method' });
  await expect(tender).toBeVisible();
  await tender.click();
  await page.getByRole('option', { name: 'CARD' }).click();
  await expect(tender).toContainText('CARD');
});

test('shift history status filter uses the shadcn select', async ({ page }) => {
  await useMockedRegister(page);
  await signIn(page);
  await page.getByRole('link', { name: 'Shift', exact: true }).click();
  await page.getByRole('link', { name: 'Shift history' }).click();

  const filter = page.getByRole('combobox', { name: 'Filter by status' });
  await expect(filter).toBeVisible();
  await filter.click();
  await page.getByRole('option', { name: 'Open' }).click();
  await expect(filter).toContainText('Open');
});
