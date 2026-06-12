import { expect, test } from '@playwright/test';

// Action-first detail (#9): the recruiter opens the top Decision and can
// inspect the evidence rather than trust a summary.

test('detail opens action-first with an inspectable Case explorer', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  // Call panel above the fold with the Track Record and its basis.
  await expect(detail).toContainText('Recommendation');
  await expect(detail).toContainText(/Worked in 40 of 60 similar cases \(.+\)/);

  // Evidence folds below, collapsed by default.
  const evidenceFold = detail.getByText('What happened in similar events (60 cases)');
  await expect(evidenceFold).toBeVisible();
  await expect(detail.getByText('40 worked')).toBeHidden();

  // Open the explorer: proportion summary, similarity-ranked rows with tags.
  await evidenceFold.click();
  await expect(detail.getByText('40 worked')).toBeVisible();
  await expect(detail.getByText('67% success across 60 cases')).toBeVisible();
  await expect(detail.getByText('Partner Summit 2023 — Lisbon')).toBeVisible();
  await expect(detail.getByText('64% similar')).toBeVisible();
  await expect(detail.getByText('Iberia').first()).toBeVisible();
  const patterns = detail.getByTestId('patterns');
  await expect(patterns).toContainText('15 of the 40 successes');
  await expect(patterns).toContainText('9 of the 20 failures');
  await expect(detail.getByText('Pattern 1').first()).toBeVisible();

  // Outcome filter: only failed cases remain.
  await detail.getByRole('button', { name: 'Didn’t work' }).click();
  await expect(detail.getByText('Customer Roadshow 2022 — Lisbon')).toBeVisible();
  await expect(detail.getByText('Partner Summit 2023 — Lisbon')).toBeHidden();

  // Exceptions behind a filter chip, with why-they-matter-now.
  await detail.getByRole('button', { name: 'Exceptions (1)' }).click();
  await expect(detail.getByText(/Government-owned venues/)).toBeVisible();
  await expect(detail.getByText(/Legal review averaged 11\.7 days vs 5\.6/)).toBeVisible();
});

test('zero-case evidence renders honest Program Memory state', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  await page.getByRole('button', { name: /Badge design refresh/i }).click();
  await expect(detail.getByText('No comparable cases in Program Memory yet.')).toBeVisible();

  const evidenceFold = detail.getByText('What happened in similar events (0 cases)');
  await expect(evidenceFold).toBeVisible();
  await evidenceFold.click();
  await expect(detail.getByText('No similar cases yet — Program Memory grows as decisions resolve.')).toBeVisible();
});

test('urgency chip opens the rubric popover', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  await detail.getByRole('button', { name: /CRITICAL/ }).click();
  await expect(detail.getByText('Urgency = size and reversibility of the business loss if nobody acts.')).toBeVisible();
});

test('what’s-different entries always carry why-it-matters', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  await detail.getByText('What’s different this time (2)').click();
  await expect(detail.getByText(/Why it matters:/).first()).toBeVisible();
});

test('mobile: list → detail with back button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  // List first on a phone; tapping a row opens the detail.
  const row = page.getByRole('button', { name: /force majeure/i });
  await expect(row).toBeVisible();
  await row.click();

  const detail = page.getByTestId('decision-detail');
  await expect(detail).toContainText('Recommendation');

  // Back returns to the queue.
  await detail.getByRole('button', { name: '← Back to queue' }).click();
  await expect(page.getByRole('button', { name: /force majeure/i })).toBeVisible();
});
