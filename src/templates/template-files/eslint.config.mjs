import openmrs from '@openmrs/eslint-config';
{{#if accessibility}}
import jsxA11y from 'eslint-plugin-jsx-a11y';
{{/if}}

export default [
  { ignores: ['dist/**'] },
  ...openmrs,
{{#if accessibility}}
  jsxA11y.flatConfigs.recommended,
{{/if}}
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
