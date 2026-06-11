import { expect, test } from '@playwright/test';

// Recruiter-journey e2e, slice-1 segment. Grows with each issue; gates every
// Pages deploy — a red run keeps the previous demo live.
test('app loads with the inbox rendered and the top Decision selected', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Program Intel' })).toBeVisible();

  const topRow = page.getByRole('button', { name: /force majeure/i });
  await expect(topRow).toBeVisible();
  await expect(topRow).toHaveAttribute('aria-current', 'true');

  await expect(page.getByTestId('decision-detail')).toContainText('Lisbon venue contract missing force majeure clause');
  await expect(page.getByTestId('decision-detail')).toContainText('Recommendation');
});
