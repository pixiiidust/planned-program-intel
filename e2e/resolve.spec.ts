import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// The resolution moment (#10): four verbs writing through the persistence
// port (IndexedDB). State survives reload; the Decided tab is the proof.

test('Accept: reasoning prefilled, resolves, auto-advances, persists across reload', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  await detail.getByRole('button', { name: 'Accept', exact: false }).click();

  // Reasoning prefilled from the recommendation's why — one edit from documented.
  const reasoning = detail.getByLabel('Your reasoning');
  await expect(reasoning).toHaveValue(/Removes the \$310K exposure/);
  await reasoning.fill('Removes the $310K exposure. January in Lisbon is storm season — this is the exact scenario the clause covers.');
  await detail.getByRole('button', { name: 'Save decision' }).click();

  // Nudge toast (d1 has a seeded sibling) + auto-advance to the next item.
  await expect(page.getByText(/✓ Decided\. Your reasoning now appears/)).toBeVisible();
  await expect(detail).toContainText('Austin hotel contract stuck in VP approval');

  // Persisted: a reload finds the Resolution in Decided.
  await page.reload();
  await page.getByRole('button', { name: /^Decided \(/ }).click();
  const row = page.getByRole('button', { name: /force majeure/i });
  await expect(row).toContainText('accepted');
  await expect(row).toContainText('by Priya Nair');
  await expect(detail).toContainText(/accepted by Priya Nair · just now/i);
  await expect(detail).toContainText('storm season');
});

test('Escalate: routes to a suggested person, ownership retained, persists', async ({ page }) => {
  await page.goto('/');

  // Open the Berlin AV decision and escalate it.
  await page.getByRole('button', { name: /AV quote 22% over benchmark/i }).click();
  const detail = page.getByTestId('decision-detail');
  await detail.getByRole('button', { name: 'Escalate', exact: false }).click();

  // System-suggested people with their authority stated.
  await expect(detail).toContainText('Owns the variance approval if you accept the higher quote instead.');
  await detail.getByRole('radio').nth(1).check();
  await detail.getByRole('button', { name: '+ Needs domain expertise I don’t have' }).click();
  await detail.getByRole('button', { name: 'Send for feedback' }).click();

  await expect(page.getByText('✓ Moved to Waiting')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: /^Waiting \(/ }).click();
  const row = page.getByRole('button', { name: /AV quote 22% over benchmark/i });
  await expect(row).toContainText('With Tom Okafor · escalated by Marcus Webb');
});

test('Change and Override require an alternative action and reasoning', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  await detail.getByRole('button', { name: 'Change', exact: false }).click();
  // Action prefilled for editing; reasoning still required.
  await expect(detail.getByLabel('What will you do instead?')).toHaveValue(/force majeure addendum/);
  await expect(detail.getByRole('button', { name: 'Save decision' })).toBeDisabled();

  await detail.getByLabel('Your reasoning').fill('Offer 3% earlier deposit instead — cash-flow review flagged 5%.');
  await detail.getByRole('button', { name: 'Save decision' }).click();

  await expect(page.getByText(/✓ Decided\. Your reasoning now appears/)).toBeVisible();
  await page.getByRole('button', { name: /^Decided \(/ }).click();
  await expect(page.getByRole('button', { name: /force majeure/i })).toContainText('changed');
});

test('Reset demo data restores the pristine seed', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  await detail.getByRole('button', { name: 'Accept', exact: false }).click();
  await detail.getByRole('button', { name: 'Save decision' }).click();
  await expect(page.getByText(/✓ Decided\. Your reasoning now appears/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Decided \(8\)/ })).toBeVisible();

  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page.getByText('✓ Demo data reset to the pristine seed')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Decided \(7\)/ })).toBeVisible();
  await expect(page.getByTestId('decision-detail')).toContainText('Lisbon venue contract missing force majeure clause');
});

async function tamperSeedVersion(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('ppi-demo');
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('meta', 'readwrite');
          tx.objectStore('meta').put({ key: 'seedVersion', value: 'stale-version-from-old-deploy' });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );
}

test('a stale seed version is detected and reseeded with a one-line toast', async ({ page }) => {
  await page.goto('/');
  const detail = page.getByTestId('decision-detail');

  // Make a change, then simulate an old deploy's version stamp.
  await detail.getByRole('button', { name: 'Accept', exact: false }).click();
  await detail.getByRole('button', { name: 'Save decision' }).click();
  await expect(page.getByRole('button', { name: /^Decided \(8\)/ })).toBeVisible();
  await tamperSeedVersion(page);

  await page.reload();
  await expect(page.getByText('Demo data refreshed — a new version of the seed was deployed.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Decided \(7\)/ })).toBeVisible();
});
