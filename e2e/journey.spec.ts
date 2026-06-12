import { expect, test } from '@playwright/test';

// THE recruiter journey (slice-1 segment, #11) — the crown-jewel e2e that
// gates every deploy: land in the inbox, resolve the top Decision with typed
// reasoning, watch the Precedent land in a similar open Decision's Evidence
// without moving its Track Record, and find the Resolution in Decided.

test('the memory loop closes visibly: resolve → Precedent lands in sibling → counts never move', async ({ page }) => {
  // Land in the inbox, top Decision selected, no tour.
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');
  await expect(detail).toContainText('Lisbon venue contract missing force majeure clause');

  // Resolve it with typed reasoning.
  await detail.getByRole('button', { name: 'Accept', exact: false }).click();
  await detail
    .getByLabel('Your reasoning')
    .fill('Removes the $310K exposure for deposit timing only. January in Lisbon is storm season — the exact scenario the clause covers.');
  await detail.getByRole('button', { name: 'Save decision' }).click();

  // The nudge: the loop closes in front of the user.
  const nudge = page.getByText('✓ Decided. Your reasoning now appears in 1 similar open decision');
  await expect(nudge).toBeVisible();

  // Follow it to the sibling.
  await page.getByRole('button', { name: 'View' }).click();
  await expect(detail).toContainText('Berlin venue contract missing cancellation cap');

  // The Precedent sits in the sibling's Evidence: visually distinct, with
  // decider and recency, outcome pending.
  await detail.getByText('What happened in similar events (60 cases)').click();
  const precedents = detail.getByTestId('precedents');
  await expect(precedents).toContainText('Precedents · outcome pending, not in the counts');
  await expect(precedents).toContainText(/accepted just now by Priya Nair — outcome pending/i);
  await expect(precedents).toContainText('storm season');
  await expect(precedents).toContainText('from: Lisbon venue contract missing force majeure clause');

  // The Track Record never lies: counts and proportion unchanged by the Precedent.
  await expect(detail).toContainText('Worked in 40 of 60 similar cases');
  await expect(detail.getByText('40 worked')).toBeVisible();
  await expect(detail.getByText('67% success across 60 cases')).toBeVisible();

  // The Resolution is in Decided.
  await page.getByRole('button', { name: /^Decided \(8\)/ }).click();
  await expect(page.getByRole('button', { name: /force majeure/i })).toContainText('accepted');

  // And all of it survives a reload — Program Memory is persistent.
  await page.reload();
  await page.getByRole('button', { name: /cancellation cap/i }).click();
  await page.getByTestId('decision-detail').getByText('What happened in similar events (60 cases)').click();
  await expect(page.getByTestId('precedents')).toContainText(/accepted just now by Priya Nair/i);
});

test('no sibling, no nudge: resolving without a landing place shows the plain jump-back toast', async ({ page }) => {
  await page.goto('/');

  // d4 (caterer policy exception) has no sibling entry in the seed map.
  await page.getByRole('button', { name: /caterer unavailable/i }).click();
  const detail = page.getByTestId('decision-detail');
  await detail.getByRole('button', { name: 'Accept', exact: false }).click();
  await detail.getByRole('button', { name: 'Save decision' }).click();

  await expect(page.getByText('✓ Moved to Decided')).toBeVisible();
  await expect(page.getByText(/similar open decision/)).toBeHidden();
});
