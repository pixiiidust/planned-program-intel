import { expect, test } from '@playwright/test';

// Import from Playwright directly: the live smoke must not use e2e/fixtures,
// because those fixtures abort distill and this suite watches production.

test('live demo loads and the inbox renders', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByTestId('decision-detail')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Needs you \(\d+\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Decided \(\d+\)/ })).toBeVisible();
});

test('a Decision can be resolved on the live demo', async ({ page }) => {
  await page.goto('./');

  await page
    .getByTestId('decision-detail')
    .getByRole('button', { name: 'Accept', exact: false })
    .click();
  await page.getByRole('button', { name: 'Save decision' }).click();

  // This fires one real distill via the Worker, but asserts resolution only:
  // never the '✦ distilled' progressive enhancement (ADR-0002).
  await expect(page.getByText(/✓ Decided\. Your reasoning now appears/)).toBeVisible();
});

test('the Worker answers (403 to a foreign origin is "alive")', async ({ request }) => {
  // 403-before-everything is the Worker origin gate (apps/edge/src/worker.ts):
  // a deployed-and-answering probe with no KV count, rate budget, or tokens.
  const res = await request.post('https://ppi-distill.pixiiidust.workers.dev/distill', {
    data: {},
  });

  expect(res.status()).toBe(403);
});
