import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  compressHTML: true,
  trailingSlash: 'never',
  build: { format: 'file' },
  security: { csp: true },
  markdown: { syntaxHighlight: false },
  vite: { plugins: [tailwindcss()] },
});
