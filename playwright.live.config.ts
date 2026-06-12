import { defineConfig } from '@playwright/test';

// Daily live-link smoke (#23): drives the DEPLOYED demo, not a local build.
// Deliberately separate from playwright.config.ts - the deploy gate (e2e/)
// must stay deterministic and offline; this config watches production.
export default defineConfig({
  testDir: './e2e-live',
  timeout: 60_000,
  retries: 2,
  use: {
    baseURL: 'https://pixiiidust.github.io/planned-program-intel/',
  },
});
