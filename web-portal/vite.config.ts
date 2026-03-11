import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@my-telco/design-tokens': path.resolve(__dirname, '../platform-config/design-tokens/tokens.json'),
    },
  },
  server: {
    port: 3000,
  },
});
