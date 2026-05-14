import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

process.env.TZ = 'UTC';

const r = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^.*\.s?css$/, replacement: 'identity-obj-proxy' }],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    setupFiles: [r('./tools/setup-tests.ts')],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
{{#if coverageThresholds}}
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/vendor/**', '**/src/**/*.test.*', '**/src/declarations.d.ts', '**/e2e/**', 'src/index.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
{{/if}}
    server: {
      deps: {
        inline: [/@openmrs/],
      },
    },
    alias: [
      { find: /^@openmrs\/esm-framework$/, replacement: '@openmrs/esm-framework/mock' },
      { find: 'react-i18next', replacement: r('./__mocks__/react-i18next.js') },
{{#if pathAliases}}
{{#each pathAliases}}
      { find: /^@{{this}}\/(.*)$/, replacement: r('./src/{{this}}/') + '$1' },
{{/each}}
{{else}}
      { find: /^@hooks\/(.*)$/, replacement: r('./src/hooks/') + '$1' },
      { find: /^@resources\/(.*)$/, replacement: r('./src/resources/') + '$1' },
      { find: /^@utils\/(.*)$/, replacement: r('./src/utils/') + '$1' },
{{/if}}
    ],
  },
});
