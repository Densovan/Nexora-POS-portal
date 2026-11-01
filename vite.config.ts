import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const lib = (path: string) => fileURLToPath(new URL(`./src/lib/nexora/${path}`, import.meta.url));
const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: src('') },
      { find: '@nexora/api-client', replacement: lib('api-client/index.ts') },
      { find: '@nexora/api-types', replacement: lib('api-types/index.ts') },
      { find: '@nexora/auth', replacement: lib('auth/index.tsx') },
      { find: '@nexora/permissions', replacement: lib('permissions/index.tsx') },
      { find: '@nexora/validation', replacement: lib('validation/index.ts') },
    ],
  },
  server: { port: 5175 },
});
