import { defineConfig } from 'vitest/config';

// Run only source tests. The TypeScript build also emits compiled *.test.js files into dist/,
// which Vitest 5 would otherwise pick up and run a second time.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
