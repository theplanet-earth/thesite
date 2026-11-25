// The replication of OpenStreetMap as the globe reads it, src/globe/replication.js (node --test).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAX_FILES, TARGET_EDITS, lastRunOf, mergeEdits, parseChangesets, pathOf, sequenceOf } from '../src/globe/replication.js';

const state = '---\nlast_run: 2026-11-24 19:28:00.847874000 +00:00\nsequence: 7280737\n';

const changeset = (id, closed, { box = [45, 45.01, 9, 9.02], open = 'false', changes = 7 } = {}) =>
  `<changeset id="${id}" created_at="${closed}" closed_at="${closed}" open="${open}" num_changes="${changes}" user="someone &amp; co" uid="1" ` +
  `min_lat="${box[0]}" max_lat="${box[1]}" min_lon="${box[2]}" max_lon="${box[3]}" comments_count="0">\n  <tag k="comment" v="a &quot;comment&quot;"/>\n </changeset>`;

test('sequenceOf and lastRunOf read state.yaml', () => {
  assert.equal(sequenceOf(state), 7280737);
  assert.equal(lastRunOf(state).toISOString(), '2026-11-24T19:28:00.000Z');
  assert.throws(() => sequenceOf('---\nlast_run: never\n'), /no sequence/);
  assert.equal(lastRunOf('sequence: 1\n'), null);
});

test('pathOf lays out the files as the replication does', () => {
  assert.equal(pathOf(7280737), '007/280/737.osm.gz');
  assert.equal(pathOf(5), '000/000/005.osm.gz');
});

test('parseChangesets keeps closed local edits, and nothing about people', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<osm version="0.6" generator="replicate_changesets.rb">\n${[
    changeset(1, '2026-11-24T19:26:25Z', { box: [47.2076435, 47.216549, -1.5717453, -1.5527541], changes: 6 }),
    changeset(2, '2026-11-24T19:26:30Z', { open: 'true' }),
    changeset(3, '2026-11-24T19:26:31Z', { box: [40, 42.5, 9, 9.1] }),
    '<changeset id="4" created_at="x" open="false" num_changes="1"/>',
  ].join('\n')}\n</osm>`;
  const edits = parseChangesets(xml);
  assert.deepEqual(edits, [{ lat: 47.21, lon: -1.56, changes: 6, closed: '2026-11-24T19:26:25Z' }]);
  assert.ok(!JSON.stringify(edits).includes('someone'));
});

test('mergeEdits keeps each edit once, oldest first, and the latest ones only', () => {
  const a = { lat: 1, lon: 1, changes: 1, closed: '2026-11-24T19:20:00Z' };
  const b = { lat: 2, lon: 2, changes: 2, closed: '2026-11-24T19:21:00Z' };
  const c = { lat: 3, lon: 3, changes: 3, closed: '2026-11-24T19:22:00Z' };
  assert.deepEqual(mergeEdits([b, a], [c, b]), [a, b, c]);
  assert.deepEqual(mergeEdits([a, b], [c], 2), [b, c]);
  assert.equal(mergeEdits([], Array.from({ length: 300 }, (_, i) => ({ ...a, lat: i }))).length, TARGET_EDITS);
  assert.equal(mergeEdits([], Array.from({ length: 300 }, (_, i) => ({ ...a, lat: i })), Infinity).length, 300);
});

test('the window is about the snapshot of the build', () => {
  assert.equal(TARGET_EDITS, 120);
  assert.ok(MAX_FILES >= 4 && MAX_FILES <= 15);
});
