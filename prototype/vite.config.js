import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from https://pixiiidust.github.io/planned-program-intel/
  base: '/planned-program-intel/',
});
