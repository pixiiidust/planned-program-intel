import { expect, test } from './fixtures';

// Portfolio (#19) stays one tab behind the inbox: whole-program, read-only,
// and live from the same in-memory Decisions the user is resolving.

test('inbox-first, Portfolio one tab away', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await expect(page.getByRole('button', { name: /^Needs you \(12\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Portfolio' }).click();

  await expect(page.getByRole('heading', { name: 'Portfolio' })).toBeVisible();
  await expect(page.getByText('Global Sales Kickoff 2027').first()).toBeVisible();
  await expect(page.getByText('EMEA Customer Summit').first()).toBeVisible();
  await expect(page.getByText('Q3 Exec Offsite').first()).toBeVisible();
  await expect(page.getByText('Product Launch Roadshow').first()).toBeVisible();
  await expect(page.getByText('4 events · 12 need attention · 1 waiting on feedback · 7 decided')).toBeVisible();

  await page.getByRole('button', { name: 'Inbox' }).click();
  await expect(page.getByRole('button', { name: /^Needs you \(12\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Waiting \(1\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Decided \(7\)/ })).toBeVisible();
});

test('escalation aging visible', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await page.getByRole('button', { name: 'Portfolio' }).click();

  await expect(page.getByText('With James Tan · 2d').first()).toBeVisible();
});

test('Program Memory represented', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await page.getByRole('button', { name: 'Portfolio' }).click();

  await expect(page.getByRole('heading', { name: 'Program Memory' })).toBeVisible();
  await expect(page.getByText(/patterns named/)).toBeVisible();
  await expect(page.getByText('7 resolutions written')).toBeVisible();
});

test('rollup is live', async ({ page }) => {
  await page.goto('/?feedDelay=0');
  const detail = page.getByTestId('decision-detail');

  await detail.getByRole('button', { name: 'Accept', exact: false }).click();
  await detail.getByRole('button', { name: 'Save decision' }).click();
  await expect(page.getByText(/Decided\. Your reasoning now appears/)).toBeVisible();

  await page.getByRole('button', { name: 'Portfolio' }).click();
  await expect(page.getByText('4 events · 11 need attention · 1 waiting on feedback · 8 decided')).toBeVisible();
  await expect(page.getByText('8 resolutions written')).toBeVisible();
});

test('mobile renders stacked event cards', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?feedDelay=0');

  const portfolio = page.getByRole('button', { name: 'Portfolio' });
  await expect(portfolio).toBeVisible();
  await portfolio.click();

  const card = page.locator('article').filter({ hasText: 'Global Sales Kickoff 2027' });
  await expect(card).toBeVisible();
  await expect(card.getByText('Next deadline')).toBeVisible();
});
