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

test('resolving feeds the activity panel and the badge tracks unseen', async ({ page }) => {
  await page.goto('/');
  const activityButton = page.getByRole('button', { name: 'Activity' });
  await expect(activityButton).toBeVisible();
  await expect(activityButton).not.toContainText('1');

  await resolveLisbon(page);

  await expect(activityButton).toContainText('1');
  await activityButton.click();

  const dialog = page.getByRole('dialog', { name: 'Activity' });
  await expect(dialog).toBeVisible();
  const entry = dialog.locator('li').filter({ hasText: '✓ Decided. Your reasoning now appears in 1 similar open decision' });
  await expect(entry).toHaveAttribute('data-unseen', 'true');
  await expect(dialog.getByText('✦ distilled')).toHaveCount(0);

  await dialog.getByRole('button', { name: 'View' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByTestId('decision-detail')).toContainText('Berlin venue contract missing cancellation cap');
  await expect(activityButton).not.toContainText('1');
});

test('closing the panel marks entries seen', async ({ page }) => {
  await resolveLisbon(page);

  const activityButton = page.getByRole('button', { name: 'Activity' });
  await activityButton.click();
  await page.keyboard.press('Escape');
  await activityButton.click();

  const dialog = page.getByRole('dialog', { name: 'Activity' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('✓ Decided. Your reasoning now appears in 1 similar open decision')).toBeVisible();
  await expect(dialog.locator('[data-unseen]')).toHaveCount(0);
});

test('reset clears the list down to the reset entry', async ({ page }) => {
  await resolveLisbon(page);

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Reset demo data' }).click();
  await page.getByRole('button', { name: 'Activity' }).click();

  const dialog = page.getByRole('dialog', { name: 'Activity' });
  await expect(dialog.locator('li')).toHaveCount(1);
  await expect(dialog.locator('li')).toContainText('✓ Demo data reset to the pristine seed');
});
