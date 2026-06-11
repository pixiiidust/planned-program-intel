import { defineConfig } from 'vitest/config';

// Unit tests live next to their source in workspaces.
// Playwright owns e2e/ — keep it out of Vitest's glob.
export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'apps/**/*.test.tsx'],
  },
});
