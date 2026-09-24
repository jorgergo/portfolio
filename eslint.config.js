import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// AGENTS.md rules the linter can enforce. Selectors match the ESTree/JSX AST
// that typescript-eslint and astro-eslint-parser produce.
const noClasses = [
  {
    selector: 'ClassDeclaration, ClassExpression',
    message: 'Functional code only: use pure functions over plain data.',
  },
];

const cspSafeMarkup = [
  {
    selector: 'JSXAttribute[name.name="style"]',
    message: 'The hashed CSP blocks inline style="": use Tailwind classes.',
  },
  {
    selector:
      'JSXAttribute[name.namespace.name="define"][name.name.name="vars"]',
    message: 'The hashed CSP blocks define:vars: use Tailwind classes.',
  },
  {
    selector: 'JSXAttribute[name.namespace.name="is"][name.name.name="inline"]',
    message: 'Client code goes in bundled <script> tags, never is:inline.',
  },
];

export default defineConfig(
  globalIgnores([
    'dist/',
    '.astro/',
    '.wrangler/',
    '.claude/',
    '.agents/',
    'referece-images/',
  ]),
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs['flat/recommended'],
  astro.configs['flat/jsx-a11y-recommended'],
  {
    rules: {
      'no-restricted-syntax': ['error', ...noClasses],
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      'no-restricted-syntax': ['error', ...noClasses, ...cspSafeMarkup],
      'astro/no-set-html-directive': 'error',
      'astro/no-omitted-end-tags': 'error',
      'astro/valid-compile': 'error',
    },
  },
  {
    files: ['*.js', '*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
