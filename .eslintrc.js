module.exports = {
  root: true,
  extends: 'expo',
  env: { browser: true, node: true, es2022: true },
  ignorePatterns: ['dist/', 'coverage/', 'node_modules/', 'supabase/functions/', 'public/generate-icons.html'],
  overrides: [
    { files: ['__tests__/**', '**/*.test.*'], env: { jest: true } },
    { files: ['public/service-worker.js'], env: { serviceworker: true } },
  ],
};
