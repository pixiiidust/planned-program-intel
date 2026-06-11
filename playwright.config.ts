import { defineConfig } from '@playwright/test';

// The recruiter-journey e2e runs against the built app (vite preview),
// exactly what GitHub Pages will serve. CI gates deploys on this passing.
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
