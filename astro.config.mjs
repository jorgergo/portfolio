import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Spec 0003: one Fontsource file per variant, resolved as a package import and
// copied into dist/ by the local provider, so the build never touches the network.
const plexFile = (family, weight) =>
  `@fontsource/ibm-plex-${family}/files/ibm-plex-${family}-latin-${weight}-normal.woff2`;

const plex = (family, fallbacks) => ({
  provider: fontProviders.local(),
  fallbacks,
  options: {
    variants: [
      { weight: 400, style: 'normal', src: [plexFile(family, 400)] },
      { weight: 500, style: 'normal', src: [plexFile(family, 500)] },
    ],
  },
});

// src/pages/_dev/ is never routed on its own; the style guide exists only under
// `astro dev`, so nothing of it reaches dist/.
const devStyleguide = {
  name: 'dev-styleguide',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') {
        injectRoute({
          pattern: '/styleguide',
          entrypoint: './src/pages/_dev/styleguide.astro',
        });
      }
    },
  },
};

export default defineConfig({
  // Spec 0006: every canonical, share image URL, and card footer derives from
  // this one value, so Go live confirms or changes it here and nowhere else.
  site: 'https://jorgergo.dev',
  output: 'static',
  compressHTML: true,
  trailingSlash: 'never',
  build: { format: 'file' },
  security: { csp: true },
  markdown: { syntaxHighlight: false },
  integrations: [devStyleguide],
  fonts: [
    {
      ...plex('mono', ['ui-monospace', 'Menlo', 'Consolas', 'monospace']),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
    },
    {
      ...plex('sans', ['system-ui', 'sans-serif']),
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
