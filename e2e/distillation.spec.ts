import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

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

test('degradation: proxy down → verbatim Precedent, silently', async ({ page }) => {
  const detail = await resolveLisbon(page);

  await expect(page.getByText('✓ Decided. Your reasoning now appears in 1 similar open decision')).toBeVisible();
  await expect(page.getByText('✦ distilled')).toHaveCount(0);

  await page.getByRole('button', { name: 'View' }).click();
  await expect(detail).toContainText('Berlin venue contract missing cancellation cap');
  await detail.getByText('What happened in similar events (60 cases)').click();
  const precedents = detail.getByTestId('precedents');
  await expect(precedents).toContainText('Removes the $310K exposure');
  await expect(precedents).not.toContainText('✦ distilled');
});

test('success: distilled text swaps in, is marked, and persists', async ({ page }) => {
  await page.route('**/distill', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        distilled: 'Accepted the addendum because storm exposure outweighed the deposit ask. Memory favors covered contracts.',
      }),
    }),
  );

  const detail = await resolveLisbon(page);

  await expect(page.getByText('✦ distilled')).toBeVisible();
  await page.getByRole('button', { name: 'View' }).click();
  await expect(detail).toContainText('Berlin venue contract missing cancellation cap');
  await detail.getByText('What happened in similar events (60 cases)').click();
  let precedents = detail.getByTestId('precedents');
  await expect(precedents).toContainText('Accepted the addendum because storm exposure outweighed the deposit ask. Memory favors covered contracts.');
  await expect(precedents.getByText('✦ distilled')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: /Berlin venue contract missing cancellation cap/i }).click();
  await page.getByTestId('decision-detail').getByText('What happened in similar events (60 cases)').click();
  precedents = page.getByTestId('precedents');
  await expect(precedents).toContainText('Accepted the addendum because storm exposure outweighed the deposit ask. Memory favors covered contracts.');
  await expect(precedents.getByText('✦ distilled')).toBeVisible();
});
