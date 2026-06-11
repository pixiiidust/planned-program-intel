import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base: the identical build serves at
// pixiiidust.github.io/planned-program-intel/app/ today and at the repo root
// after the slice-1 cutover (#11) — no rebuild difference between the two.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
});
