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

test('escalatee returns feedback to the owner queue', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await expect(page.getByRole('button', { name: /^Needs you \(12\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Waiting \(1\)/ })).toBeVisible();

  await page.getByRole('button', { name: /Roadshow venue license sign-off sitting in legal/i }).click();
  await page.getByRole('button', { name: /^Escalate/ }).click();
  await page.getByLabel('Your reasoning').fill('Sign-off authority sits above me and legal needs delegated pressure.');
  await page.getByRole('button', { name: 'Send for feedback' }).click();

  await expect(page.getByRole('button', { name: /^Waiting \(2\)/ })).toBeVisible();
  await page.getByRole('button', { name: /^Waiting \(2\)/ }).click();
  const waitingRow = page.getByRole('button', { name: /Roadshow venue license sign-off sitting in legal/i });
  await expect(waitingRow).toContainText(/With Mei Lin.*escalated by Dana Ortiz/);

  await choosePersona(page, 'Mei Lin');
  await expect(page.getByRole('button', { name: /^Needs you \(1\)/ })).toBeVisible();
  const requestRow = page.getByRole('button', { name: /Roadshow venue license sign-off sitting in legal/i });
  await expect(requestRow).toContainText('FEEDBACK REQUESTED');

  const requestDetail = page.getByTestId('decision-detail');
  await expect(requestDetail).toContainText('Dana Ortiz asked for your feedback');
  await expect(requestDetail.getByLabel('Your feedback')).toBeVisible();
  await expect(requestDetail.getByRole('button', { name: /^Accept/ })).toHaveCount(0);

  const feedback = "Take it to the venue's counsel directly - I'll flag it to James.";
  await requestDetail.getByLabel('Your feedback').fill(feedback);
  await requestDetail.getByRole('button', { name: 'Return feedback' }).click();

  await choosePersona(page, 'Whole program');
  const returnedRow = page.getByRole('button', { name: /Roadshow venue license sign-off sitting in legal/i });
  await expect(returnedRow).toContainText('FEEDBACK RETURNED');
  await returnedRow.click();

  const returnedDetail = page.getByTestId('decision-detail');
  await expect(returnedDetail).toContainText('Feedback from Mei Lin');
  await expect(returnedDetail).toContainText(feedback);
  await expect(returnedDetail.getByRole('button', { name: /^Accept/ })).toBeVisible();

  await page.reload();
  const persistedRow = page.getByRole('button', { name: /Roadshow venue license sign-off sitting in legal/i });
  await expect(persistedRow).toContainText('FEEDBACK RETURNED');
  await persistedRow.click();
  await expect(page.getByTestId('decision-detail')).toContainText('Feedback from Mei Lin');
  await expect(page.getByTestId('decision-detail')).toContainText(feedback);
});

test('seeded escalation can return feedback', async ({ page }) => {
  await page.goto('/?feedDelay=0');

  await choosePersona(page, 'James Tan');
  await expect(page.getByRole('button', { name: /^Needs you \(1\)/ })).toBeVisible();

  const feedback = 'Approve only if sales funds the overage from their launch reserve.';
  await page.getByTestId('decision-detail').getByLabel('Your feedback').fill(feedback);
  await page.getByRole('button', { name: 'Return feedback' }).click();

  await choosePersona(page, 'Whole program');
  const returnedRow = page.getByRole('button', { name: /keynote speaker fee/i });
  await expect(returnedRow).toContainText('FEEDBACK RETURNED');
  await expect(page.getByRole('button', { name: /^Waiting \(0\)/ })).toBeVisible();
});
