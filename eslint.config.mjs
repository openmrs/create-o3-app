import { base } from '@openmrs/eslint-config';

export default [
  {
    ignores: [
      'dist/**',
      '*.config.ts',
      'src/templates/template-files/**',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
  },
  ...base,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // A CLI's output is the console; the shared config's restriction targets browser code.
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'always',
        },
      ],
    },
  },
];
