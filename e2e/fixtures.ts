import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Distillation network is opt-in per spec: the degradation contract (proxy down,
    // verbatim stays) is the deterministic baseline for the whole suite, and CI must
    // never hit the live Worker. A spec re-routes '**/distill' to test success.
    await page.route('**/distill', (route) => route.abort());
    await use(page);
  },
});

export { expect } from '@playwright/test';
