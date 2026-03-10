import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import babelParser from '@babel/eslint-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importXPlugin from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendFolder = path.join(__dirname, 'frontend');

const dirs = fs
  .readdirSync(path.join(frontendFolder, 'src'), { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .join('|');

const importGroups = [
  ['^@?\\w', `^(${dirs})(/.*|$)`, '^\\.', '^\\..*css$'],
];

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: ['**/JsLibraries/**', '**/*.css.d.ts', '**/node_modules/**'],
  },

  // -----------------------------------------------------------------------
  // Base config for all frontend JS/TS/TSX files
  // Includes logic, correctness, and best-practice rules only.
  // All formatting is delegated to Prettier.
  // -----------------------------------------------------------------------
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],

    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'import-x': importXPlugin,
      prettier: prettierPlugin,
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        ...globals.es2021,
        expect: 'readonly',
        chai: 'readonly',
        sinon: 'readonly',
        JSX: 'writable',
      },
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // Prettier — enforce on all files (JS + TS)
      'prettier/prettier': 'error',

      // --- ECMAScript 6 (logic rules only) ---
      'constructor-super': 'error',
      'no-class-assign': 'error',
      'no-const-assign': 'error',
      'no-dupe-class-members': 'error',
      'no-duplicate-imports': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-this-before-super': 'error',
      'no-useless-escape': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-var': 'warn',
      'object-shorthand': ['error', 'properties'],
      'prefer-arrow-callback': 'error',
      'prefer-const': 'warn',
      'prefer-spread': 'warn',
      'prefer-template': 'error',

      // --- Possible Errors ---
      'no-cond-assign': 'error',
      'no-console': 'off',
      'no-constant-condition': 'warn',
      'no-control-regex': 'error',
      'no-debugger': 'off',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-empty-character-class': 'error',
      'no-ex-assign': 'error',
      'no-extra-boolean-cast': 'error',
      'no-func-assign': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-obj-calls': 'error',
      'no-regex-spaces': 'error',
      'no-sparse-arrays': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'warn',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // --- Best Practices ---
      'array-callback-return': 'warn',
      'block-scoped-var': 'warn',
      curly: 'error',
      'default-case': 'error',
      'dot-notation': 'error',
      eqeqeq: ['error', 'smart'],
      'guard-for-in': 'error',
      'no-alert': 'warn',
      'no-caller': 'error',
      'no-case-declarations': 'error',
      'no-div-regex': 'error',
      'no-else-return': 'error',
      'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      'no-empty-pattern': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-fallthrough': 'error',
      'no-implicit-coercion': [
        'error',
        { boolean: false, number: true, string: true },
      ],
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-invalid-this': 'off',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-global-assign': ['error', { exceptions: ['console'] }],
      'no-new': 'off',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'off',
      'no-proto': 'error',
      'no-redeclare': 'error',
      'no-return-assign': 'warn',
      'no-script-url': 'error',
      'no-self-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-unused-labels': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-void': 'error',
      'no-with': 'error',
      radix: ['error', 'as-needed'],
      yoda: 'error',

      // --- Strict Mode ---
      strict: ['error', 'never'],

      // --- Variables ---
      'init-declarations': ['error', 'always'],
      'no-delete-var': 'error',
      'no-label-var': 'error',
      'no-shadow': 'error',
      'no-shadow-restricted-names': 'error',
      'no-undef': 'error',
      'no-undef-init': 'off',
      'no-undefined': 'off',
      'no-unused-vars': [
        'error',
        { args: 'none', ignoreRestSiblings: true },
      ],

      // --- Complexity ---
      'max-depth': ['error', { maximum: 5 }],
      'max-nested-callbacks': ['error', 4],

      // --- Import Sort ---
      'simple-import-sort/imports': 'error',
      'import-x/newline-after-import': 'error',

      // --- React (logic/correctness rules) ---
      'react/jsx-boolean-value': ['error', 'always'],
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
      'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
      'react/jsx-handler-names': [
        'error',
        {
          eventHandlerPrefix: '(on|dispatch)',
          eventHandlerPropPrefix: 'on',
        },
      ],
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-uses-react': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-multi-comp': ['error', { ignoreStateless: true }],
      'react/no-unknown-property': 'error',
      'react/prefer-es6-class': 'error',
      'react/prop-types': 'error',
      'react/react-in-jsx-scope': 'error',
      'react/self-closing-comp': 'error',
      'react/sort-comp': 'error',

      // --- React Hooks ---
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  // -----------------------------------------------------------------------
  // JS-specific: Babel parser for legacy JS files with experimental syntax
  // -----------------------------------------------------------------------
  {
    files: ['frontend/**/*.js'],

    languageOptions: {
      parser: babelParser,
      parserOptions: {
        babelOptions: {
          configFile: path.join(frontendFolder, 'babel.config.js'),
        },
      },
    },

    rules: {
      'simple-import-sort/imports': [
        'error',
        { groups: importGroups },
      ],
    },
  },

  // -----------------------------------------------------------------------
  // TS/TSX-specific: TypeScript parser + recommended rules
  // -----------------------------------------------------------------------
  {
    files: ['frontend/**/*.{ts,tsx}'],

    plugins: {
      '@typescript-eslint': tsPlugin,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './frontend/tsconfig.json',
      },
    },

    rules: {
      // TypeScript recommended rules
      ...tsPlugin.configs.recommended.rules,

      // Overrides
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Disable base no-shadow in favor of TS version
      'no-shadow': 'off',

      // Import sort for TS
      'simple-import-sort/imports': [
        'error',
        { groups: importGroups },
      ],

      // React (TS-specific overrides/additions)
      'react/function-component-definition': 'error',
      'react/hook-use-state': 'error',
      'react/jsx-boolean-value': ['error', 'always'],
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/jsx-fragments': 'error',
      'react/jsx-handler-names': [
        'error',
        { eventHandlerPrefix: 'on', eventHandlerPropPrefix: 'on' },
      ],
      'react/jsx-no-bind': ['error', { ignoreRefs: true }],
      'react/jsx-no-useless-fragment': [
        'error',
        { allowExpressions: true },
      ],
      'react/jsx-pascal-case': ['error', { allowAllCaps: true }],
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          noSortAlphabetically: true,
          reservedFirst: true,
        },
      ],
      'react/prop-types': 'off',
      'react/self-closing-comp': 'error',
    },
  },

  // -----------------------------------------------------------------------
  // Prettier config last — disables all rules that conflict with Prettier
  // -----------------------------------------------------------------------
  prettierConfig,
];
