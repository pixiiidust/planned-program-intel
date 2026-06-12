import { expect, test } from './fixtures';

test('detection fires once and survives reload', async ({ page }) => {
  await page.goto('/?feedDelay=250');

  await expect(page.getByText('New decision detected from the simulated feed')).toBeVisible();
  const row = page.getByRole('button', { name: /SKO registration/i });
  await expect(row).toBeVisible();
  await expect(row.getByTestId('feed-chip')).toBeVisible();

  await row.click();
  const detail = page.getByTestId('decision-detail');
  await expect(detail.getByTestId('feed-source')).toBeVisible();
  await expect(detail).toContainText(/Worked in \d+ of \d+ similar cases/);

  await page.goto('/?feedDelay=250');
  await expect(page.getByTestId('feed-chip')).toHaveCount(1);
  await page.waitForTimeout(1000);
  await expect(page.getByTestId('feed-chip')).toHaveCount(1);
  await expect(page.getByText('New decision detected from the simulated feed')).toBeHidden();
});

test('reset re-arms', async ({ page }) => {
  await page.goto('/?feedDelay=1200');

  const row = page.getByRole('button', { name: /SKO registration/i });
  await expect(row).toBeVisible();

  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(row).toBeHidden();
  await expect(row).toBeVisible();
});

test('disabled feed never fires', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await page.waitForTimeout(1500);
  await expect(page.getByTestId('feed-chip')).toHaveCount(0);
  await expect(page.getByText('New decision detected from the simulated feed')).toBeHidden();
});
