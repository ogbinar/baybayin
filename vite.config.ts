import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/domain/**/*.test.ts', 'tests/ui/**/*.test.tsx'],
  },
});
