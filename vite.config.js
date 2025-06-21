import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [
    tailwindcss(),
  ],
  root: './',
  server: {
    port: 3000,
    open: false,
  },
});
