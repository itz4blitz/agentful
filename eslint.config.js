import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // ES2021 globals
        globalThis: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off', // TODO: Re-enable and fix
      'no-undef': 'off', // TODO: Re-enable and fix
      'no-useless-escape': 'off', // TODO: Re-enable and fix
      'semi': 'off', // TODO: Re-enable after auto-fix
      'quotes': 'off', // TODO: Re-enable after auto-fix
      'indent': 'off', // TODO: Re-enable after auto-fix
      'comma-dangle': 'off', // TODO: Re-enable after auto-fix
      'no-trailing-spaces': 'off', // TODO: Re-enable after auto-fix
      'eol-last': 'off' // TODO: Re-enable after auto-fix
    }
  },
  {
    files: ['test/**/*.js', 'test/**/*.test.js'],
    rules: {
      // TODO: Re-enable after fixing process.cwd() usage
      // 'no-restricted-syntax': [
      //   'error',
      //   {
      //     selector: 'CallExpression[callee.object.name="process"][callee.property.name="cwd"]',
      //     message: 'Do not use process.cwd() in tests. Use createTestDir() from test/helpers/test-dir.js instead for proper test isolation.'
      //   }
      // ]
    }
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'docs/.vocs/',
      'docs/dist/',
      'template/',
      '*.config.js',
      'examples/'
    ]
  }
];
