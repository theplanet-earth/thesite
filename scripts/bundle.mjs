// The bundle of the globe: esbuild bundles src/globe/main.js, with the parts of three.js it
// uses, into docs/assets/bundle/globe.js (generated, git-ignored), keeping the licence comments
// of three.js at its end. Run by scripts/bundle.sh, which npm run build and npm run serve call.
//   node scripts/bundle.mjs [--watch]
// With --watch it rebuilds on every change of src/ and, a second after each build, touches the
// bundle. Jekyll copies a file into the preview only when its time of modification moves, and
// on 2026-11-24 two builds within the same instant left the preview serving the older bundle
// (CLAUDE.md, Section 12): the late touch always moves the time past the last build.
import { utimes } from 'node:fs/promises';
import * as esbuild from 'esbuild';

const outfile = 'docs/assets/bundle/globe.js';
const options = {
  entryPoints: ['src/globe/main.js'],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  legalComments: 'eof',
  outfile,
  logLevel: 'warning',
};

if (process.argv.includes('--watch')) {
  const touchLater = {
    name: 'touch-after-build',
    setup(build) {
      build.onEnd(() => {
        setTimeout(() => {
          const now = new Date();
          utimes(outfile, now, now).catch(() => {});
        }, 1100);
      });
    },
  };
  const context = await esbuild.context({ ...options, plugins: [touchLater] });
  await context.watch();
} else {
  await esbuild.build(options);
}
