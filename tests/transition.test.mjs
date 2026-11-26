// The transition between Home and the page Map, src/globe/transition.js, and the view the
// opened globe ends on, mapView of src/globe/geometry.js (node --test).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAX_MERCATOR_LATITUDE, latitudeOfY, mapView, mercatorY } from '../src/globe/geometry.js';
import { CLOSE_MS, OPEN_MS, closing, opening } from '../src/globe/transition.js';

const close = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} is not ${expected}`);
const times = (end) => Array.from({ length: Math.ceil(end / 10) + 6 }, (_, i) => i * 10 - 20);

test('the opening starts on the globe of Home and ends on the map', () => {
  const start = opening(0);
  assert.deepEqual([start.edges, start.morph, start.tint, start.fill, start.tiles, start.grow, start.zoom], [1, 0, 0, 0, 0, 0, 1]);
  const end = opening(OPEN_MS);
  assert.deepEqual([end.edges, end.morph, end.tint, end.fill, end.tiles, end.grow, end.zoom, end.done], [0, 1, 1, 1, 1, 1, 1, true]);
});

test('the closing starts on the map and ends on the globe of Home', () => {
  const start = closing(0);
  assert.deepEqual([start.edges, start.morph, start.tint, start.fill, start.tiles, start.grow, start.turn], [0, 1, 1, 1, 1, 1, 1]);
  const end = closing(CLOSE_MS);
  assert.deepEqual([end.edges, end.morph, end.tint, end.fill, end.tiles, end.grow, end.turn, end.zoom, end.done], [1, 0, 0, 0, 0, 0, 0, 1, true]);
});

test('the spikes and arcs are gone before the globe opens, and back only once it is closed', () => {
  for (const t of times(OPEN_MS)) {
    const s = opening(t);
    if (s.morph > 0) assert.equal(s.edges, 0, `opening at ${t} ms`);
  }
  for (const t of times(CLOSE_MS)) {
    const s = closing(t);
    if (s.edges > 0) assert.equal(s.morph, 0, `closing at ${t} ms`);
  }
});

test('the tiles show only over a map that already has their colours', () => {
  for (const t of times(OPEN_MS)) {
    const s = opening(t);
    if (s.tiles > 0) assert.equal(s.tint, 1, `opening at ${t} ms`);
  }
  for (const t of times(CLOSE_MS)) {
    const s = closing(t);
    if (s.morph < 1) assert.equal(s.tiles, 0, `closing at ${t} ms`);
  }
});

test('the texts of the two pages never show together', () => {
  for (const t of times(OPEN_MS)) {
    const s = opening(t);
    assert.ok(s.textOut === 1 || s.textIn === 0, `opening at ${t} ms`);
  }
  for (const t of times(CLOSE_MS)) {
    const s = closing(t);
    assert.ok(s.textOut === 1 || s.textIn === 0, `closing at ${t} ms`);
  }
});

test('every value moves one way only, but the push of the camera, out and back', () => {
  for (const [timeline, end] of [[opening, OPEN_MS], [closing, CLOSE_MS]]) {
    for (const key of ['edges', 'turn', 'grow', 'morph', 'tint', 'fill', 'tiles', 'textOut', 'textIn']) {
      const values = times(end).map((t) => timeline(t)[key]);
      const up = values.every((v, i) => i === 0 || v >= values[i - 1]);
      const down = values.every((v, i) => i === 0 || v <= values[i - 1]);
      assert.ok(up || down, `${timeline.name} ${key}`);
      assert.ok(values.every((v) => v >= 0 && v <= 1), `${timeline.name} ${key} in [0, 1]`);
    }
    const zooms = times(end).map((t) => timeline(t).zoom);
    assert.ok(Math.max(...zooms) > 1.3 && zooms.every((z) => z >= 1));
  }
});

test('Web Mercator: the equator at 0, the edge of the square world at π', () => {
  close(mercatorY(0), 0);
  close(mercatorY(MAX_MERCATOR_LATITUDE), Math.PI);
  close(mercatorY(-MAX_MERCATOR_LATITUDE), -Math.PI);
  close(mercatorY(90), Math.PI); // beyond the edge, clamped
  close(MAX_MERCATOR_LATITUDE, 85.0511287798, 1e-9);
  for (const lat of [-60, -12.5, 0, 41.9, 80]) close(latitudeOfY(mercatorY(lat)), lat);
});

test('mapView puts the whole width of the world across the box', () => {
  const view = mapView(1024, 600);
  close(view.zoom, 2); // 1024 pixels = 4 tiles of 256
  close(view.lat, 20);
  const wide = mapView(870, 560);
  close(2 ** wide.zoom * 256, 870);
});

test('mapView moves the centre so that the box never shows beyond the edge of the world', () => {
  // A box as high as it is wide shows the whole square world: the centre must be the equator.
  const square = mapView(500, 500);
  close(square.y, 0);
  // A box three quarters as high as wide: its top reaches y = π at most.
  const box = mapView(400, 300, 80);
  close(box.y + (Math.PI * 300) / 400, Math.PI);
  assert.ok(box.lat < 80);
  const south = mapView(400, 300, -80);
  close(south.y - (Math.PI * 300) / 400, -Math.PI);
});
