import { expect, test } from './fixtures';

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

test('blocked Decisions sit in Needs you with the blocker named', async ({ page }) => {
  await page.goto('/');

  const blockedRow = page.getByRole('button', { name: /Austin hotel contract stuck/i });
  await expect(blockedRow).toBeVisible();
  await expect(blockedRow).toContainText('BLOCKED');
  await expect(blockedRow).toContainText('VP sign-off pending 6 days');
});

test('Waiting renders escalated Decisions with ownership retained', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Waiting \(/ }).click();

  const row = page.getByRole('button', { name: /keynote speaker fee/i });
  await expect(row).toBeVisible();
  await expect(row).toContainText('AWAITING FEEDBACK');
  await expect(row).toContainText('With James Tan · escalated by Dana Ortiz');

  // Tab switch auto-selects the top item.
  await expect(row).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('decision-detail')).toContainText('Waiting on feedback from James Tan');
});

test('Decided renders Resolutions with choice and decider, never a due date', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Decided \(/ }).click();

  // Newest first: the Wi-Fi upgrade was decided yesterday.
  const topRow = page.getByRole('button', { name: /Wi-Fi upgrade/i });
  await expect(topRow).toHaveAttribute('aria-current', 'true');
  await expect(topRow).toContainText('accepted');
  await expect(topRow).toContainText('by Marcus Webb');
  await expect(topRow).not.toContainText('due in');

  await expect(page.getByTestId('decision-detail')).toContainText(/accepted by Marcus Webb/i);
});

test('time filter narrows Needs you by deadline ahead', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: /AV quote 22% over benchmark/i })).toBeVisible();
  await page.getByLabel('Filter by time').selectOption('3');

  await expect(page.getByRole('button', { name: /force majeure/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /AV quote 22% over benchmark/i })).toBeHidden();
});
