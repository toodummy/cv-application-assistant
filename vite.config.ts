import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5178, strictPort: true, cors: false },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], restoreMocks: true },
});
