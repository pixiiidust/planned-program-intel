import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function resolveLisbon(page: Page) {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  await detail.getByRole('button', { name: 'Accept', exact: false }).click();
  await expect(detail.getByLabel('Your reasoning')).toHaveValue(/Removes the \$310K exposure/);
  await detail
    .getByLabel('Your reasoning')
    .fill('Removes the $310K exposure. January in Lisbon is storm season - this is the exact scenario the clause covers.');
  await detail.getByRole('button', { name: 'Save decision' }).click();
  return detail;
}

async function expectDistilledPrecedentTitle(page: Page, title: RegExp) {
  await expect(page.getByText('✦ distilled')).toBeVisible();
  await page.getByRole('button', { name: 'View' }).click();

  const detail = page.getByTestId('decision-detail');
  await expect(detail).toContainText('Berlin venue contract missing cancellation cap');
  await detail.getByText('What happened in similar events (60 cases)').click();

  const chip = detail.getByTestId('precedents').getByText('✦ distilled');
  await expect(chip).toHaveAttribute('title', title);
}

test('engine picker persists and the drawer hosts reset', async ({ page }) => {
  await page.goto('/');

  let dialog = await openSettings(page);
  await expect(dialog.getByRole('radio', { name: /Demo/ })).toBeChecked();

  await dialog.getByRole('radio', { name: /Bring your own key/ }).check();
  await dialog.getByLabel('OpenRouter API key').fill('sk-or-test-1234');
  await dialog.getByRole('textbox', { name: 'Model' }).fill('google/gemma-2-9b-it:free');

  await page.reload();
  dialog = await openSettings(page);

  await expect(dialog.getByRole('radio', { name: /Bring your own key/ })).toBeChecked();
  await expect(dialog.getByRole('textbox', { name: 'Model' })).toHaveValue('google/gemma-2-9b-it:free');
  await expect(dialog.getByLabel('OpenRouter API key')).toHaveValue('sk-or-test-1234');

  const storage = await page.evaluate(() => ({
    localKey: localStorage.getItem('ppi-byok-key'),
    sessionKey: sessionStorage.getItem('ppi-byok-key'),
  }));
  expect(storage.localKey).toBeNull();
  expect(storage.sessionKey).toBe('sk-or-test-1234');
  await expect(dialog.getByRole('button', { name: 'Reset demo data' })).toBeVisible();
});

test('BYO engine drives the live moment browser-direct', async ({ page }) => {
  await page.goto('/');

  const dialog = await openSettings(page);
  await dialog.getByRole('radio', { name: /Bring your own key/ }).check();
  await dialog.getByLabel('OpenRouter API key').fill('sk-or-test-1234');
  await page.keyboard.press('Escape');

  await page.route('**/openrouter.ai/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ distilled: 'Accepted because storm exposure outweighed the deposit ask.' }) } }],
      }),
    }),
  );

  await resolveLisbon(page);
  await expectDistilledPrecedentTitle(page, /Your key/);
});

test('Ollama selection switches the target', async ({ page }) => {
  await page.goto('/');

  const dialog = await openSettings(page);
  await dialog.getByRole('radio', { name: /Local/ }).check();
  await dialog.getByRole('textbox', { name: 'Ollama endpoint' }).fill('http://localhost:11434');
  await page.keyboard.press('Escape');

  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        message: { content: JSON.stringify({ distilled: 'Kept the local crew because the variance was not worth the premium.' }) },
      }),
    }),
  );

  await resolveLisbon(page);
  await expectDistilledPrecedentTitle(page, /Ollama/);
});
