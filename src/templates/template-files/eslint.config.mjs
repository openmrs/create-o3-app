import openmrs from '@openmrs/eslint-config';

export default [
  { ignores: ['dist/**'] },
  ...openmrs,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
