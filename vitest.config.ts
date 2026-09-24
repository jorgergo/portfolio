import { defineConfig } from 'vitest/config';

// Unit tests for src/lib only. The schema and format helpers import nothing
// from astro:content, so no Astro Vite plugin is needed (spec 0002).
// `css: true` keeps Vitest from replacing global.css with an empty module, so
// the contrast test can import it with `?raw` (spec 0003).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ['src/**/*.test.ts'], css: true },
});
