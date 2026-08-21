const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'ios/*',
      'android/*',
      '.expo/*',
      'dist/*',
      'coverage/*',
      'node_modules/*',
    ],
  },
  {
    rules: {
      'import/no-default-export': 'error',
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../../*'], message: 'Use the @/ alias.' }] },
      ],
    },
  },
  {
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-native',
                'react-native/*',
                'expo',
                'expo-*',
                '@/app/*',
                '@/features/*',
                '@/shared/*',
                '@/providers/*',
              ],
              message: 'core/ is pure domain logic and must import nothing.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/ports/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*'],
              message: 'Ports declare interfaces and import nothing.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**', 'src/providers/**'],
    ignores: ['src/shared/ports/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*'],
              message: 'shared/ must not import features/ or app/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'features/ must not import app/.' },
            {
              group: ['@/features/*/*'],
              message: 'Import a feature only via @/features/<name>.',
            },
            {
              group: [
                'expo-*',
                'react-native-mmkv',
                '@sentry/*',
                '@react-native-async-storage/async-storage',
              ],
              message:
                'Use a port from @/shared/ports instead of importing a native/vendor module.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/app/**',
      'app.config.ts',
      '*.config.js',
      '*.config.ts',
      'eslint.config.js',
      '**/*.d.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
      'no-restricted-imports': 'off',
    },
  },
]);
