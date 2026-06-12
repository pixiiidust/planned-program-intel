import { expect, test, type Page } from '@playwright/test';

// No-auth persona switching lets a demo visitor sit in every seat while the
// whole-program inbox remains the default landing view.

async function choosePersona(page: Page, name: string) {
  await page.getByTestId('persona-switcher').click();
  await page.getByTestId('persona-option').filter({ hasText: name }).click();
}

test('switcher groups seats with badges visible before switching', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await page.getByTestId('persona-switcher').click();

  await expect(page.getByText('Deciders')).toBeVisible();
  await expect(page.getByText('Escalation paths')).toBeVisible();
  await expect(page.getByTestId('persona-option').filter({ hasText: 'Priya Nair' })).toContainText('3');
  await expect(page.getByTestId('persona-option').filter({ hasText: 'James Tan' })).toContainText('1');
  await expect(page.getByTestId('persona-option').filter({ hasText: 'Mei Lin' })).toContainText('0');
});

test('switching to Priya Nair filters every tab', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await choosePersona(page, 'Priya Nair');

  await expect(page.getByRole('button', { name: /^Needs you \(3\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /force majeure/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /AV quote 22% over benchmark/i })).toBeHidden();

  await page.getByRole('button', { name: /^Decided \(1\)/ }).click();
  await expect(page.getByRole('button', { name: /StageCraft master rate card renewal/i })).toBeVisible();
});

test('switching to James Tan shows the feedback request', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await choosePersona(page, 'James Tan');

  await expect(page.getByRole('button', { name: /^Needs you \(1\)/ })).toBeVisible();
  const row = page.getByRole('button', { name: /keynote speaker fee/i });
  await expect(row).toBeVisible();
  await expect(row).toContainText('FEEDBACK REQUESTED');
  await expect(row).toContainText('Feedback for Dana Ortiz');

  const detail = page.getByTestId('decision-detail');
  await expect(detail).toContainText('Dana Ortiz asked for your feedback');
  await expect(detail.getByRole('button', { name: 'Accept', exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Waiting \(0\)/ })).toBeVisible();
});

test('switching back to Whole program restores the default queue', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await choosePersona(page, 'Priya Nair');
  await expect(page.getByRole('button', { name: /^Needs you \(3\)/ })).toBeVisible();
  await choosePersona(page, 'Whole program');

  await expect(page.getByRole('button', { name: /^Needs you \(12\)/ })).toBeVisible();
  const topRow = page.getByRole('button', { name: /force majeure/i });
  await expect(topRow).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('decision-detail')).toContainText('Lisbon venue contract missing force majeure clause');
});
