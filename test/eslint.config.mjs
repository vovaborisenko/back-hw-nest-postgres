// @ts-check
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'warn',
    },
  },
);
