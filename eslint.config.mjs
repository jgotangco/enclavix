import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  { files: ['src/**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser },
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
      // Prototype effects and nested components are replaced during their owning feature sprints.
      'react-hooks/set-state-in-effect': 'off', 'react-hooks/static-components': 'off' } },
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts']),
]);
