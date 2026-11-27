// The bundles of the site (generated, git-ignored): esbuild bundles src/globe/main.js, with the
// parts of three.js it uses, into docs/assets/bundle/globe.js, keeping the licence comments of
// three.js at its end, and src/notice/main.js, the notice of privacy of every page, into
// docs/assets/bundle/notice.js, and src/toc/main.js, the index of the pages of text, into
// docs/assets/bundle/toc.js. Run by scripts/bundle.sh, which npm run build and npm run serve
// call.
//   node scripts/bundle.mjs [--watch]
// With --watch it rebuilds on every change of src/ and, a second after each build, touches the
// bundle. Jekyll copies a file into the preview only when its time of modification moves, and
// on 2026-11-24 two builds within the same instant left the preview serving the older bundle
// (CLAUDE.md, Section 12): the late touch always moves the time past the last build.
import { utimes } from 'node:fs/promises';
import * as esbuild from 'esbuild';

const outdir = 'docs/assets/bundle';
const entryPoints = {
  globe: 'src/globe/main.js',
  notice: 'src/notice/main.js',
  toc: 'src/toc/main.js',
};
const outfiles = Object.keys(entryPoints).map((name) => `${outdir}/${name}.js`);
const options = {
  entryPoints,
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  legalComments: 'eof',
  outdir,
  logLevel: 'warning',
};

if (process.argv.includes('--watch')) {
  const touchLater = {
    name: 'touch-after-build',
    setup(build) {
      build.onEnd(() => {
        setTimeout(() => {
          const now = new Date();
          for (const outfile of outfiles) utimes(outfile, now, now).catch(() => {});
        }, 1100);
      });
    },
  };
  const context = await esbuild.context({ ...options, plugins: [touchLater] });
  await context.watch();
} else {
  await esbuild.build(options);
}
