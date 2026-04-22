import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['bin/git-mod.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  outDir: 'dist',
  shims: true,
  platform: 'node',
  target: 'node18',
  external: ['events', 'fs', 'path', 'process', 'child_process', 'util', 'url'],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
