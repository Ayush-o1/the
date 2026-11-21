import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['.build/', 'dist/', 'node_modules/', 'test-results/', 'playwright-report/', 'shots/'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
