// The pure part of the globe, src/globe/geometry.js (node --test, run by scripts/test.sh).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FrameMonitor, TIERS, isLand, landDots, startLongitude, toCartesian } from '../src/globe/geometry.js';

// A mask like the result of getImageData: land (red 255) only east of Greenwich in the north.
function mask(width = 36, height = 18) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height / 2; y += 1) {
    for (let x = width / 2; x < width; x += 1) data[(y * width + x) * 4] = 255;
  }
  return { width, height, data };
}

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

test('toCartesian puts longitude 0 towards the camera, north up and east to the right', () => {
  const [x0, y0, z0] = toCartesian(0, 0, 2);
  close(x0, 0); close(y0, 0); close(z0, 2);
  const [, yn] = toCartesian(90, 0, 2);
  close(yn, 2);
  const [xe, , ze] = toCartesian(0, 90, 2);
  close(xe, 2); close(ze, 0);
});

test('isLand reads the red byte of the pixel under a point', () => {
  const m = mask();
  assert.equal(isLand(m, 45, 45), true);
  assert.equal(isLand(m, 45, -45), false);
  assert.equal(isLand(m, -45, 45), false);
  assert.equal(isLand(m, 90, 180), true); // edges are clamped into the image
});

test('landDots keeps only land and fewer dots near the poles', () => {
  const m = mask();
  const dots = landDots(m, 18);
  assert.ok(dots.length > 0);
  assert.ok(dots.every(([lat, lon]) => lat > 0 && lon >= 0)); // a row of 3 dots has one at 0
  const near = (lat) => dots.filter(([value]) => Math.abs(value - lat) < 1e-9).length;
  assert.ok(near(85) < near(5), 'a row near the pole holds fewer dots than one near the equator');
});

test('landDots draws about 12,000 dots on an Earth-like mask with the first tier', () => {
  // About 29 per cent of the surface of the Earth is land; the band of latitudes under
  // asin(0.29) holds that share of the area of a sphere.
  const width = 720, height = 360;
  const data = new Uint8ClampedArray(width * height * 4);
  const edge = Math.asin(0.29) / (Math.PI / 180);
  for (let y = 0; y < height; y += 1) {
    const lat = 90 - ((y + 0.5) * 180) / height;
    if (Math.abs(lat) < edge) for (let x = 0; x < width; x += 1) data[(y * width + x) * 4] = 255;
  }
  const count = landDots({ width, height, data }, TIERS[0].rows).length;
  assert.ok(count > 11000 && count < 13500, `${count} dots`);
});

test('startLongitude turns the time zone into the longitude of its noon', () => {
  assert.equal(startLongitude(0), 0);
  assert.equal(startLongitude(-60), 15); // UTC+1, Rome in winter
  assert.equal(startLongitude(300), -75); // UTC-5, New York in winter
  assert.equal(startLongitude(-720), -180); // UTC+12 wraps to the antimeridian
  assert.equal(startLongitude(-765), 191.25 - 360); // UTC+12:45, Chatham Islands
});

test('FrameMonitor drops the quality after 50 slow frames, and only then', () => {
  const monitor = new FrameMonitor();
  for (let i = 0; i < 49; i += 1) assert.equal(monitor.record(25), false);
  assert.equal(monitor.record(25), true); // 40 frames a second over the last 50
  for (let i = 0; i < 100; i += 1) assert.equal(monitor.record(1000 / 60), false);
});

test('FrameMonitor looks at the last 50 frames only', () => {
  const monitor = new FrameMonitor();
  for (let i = 0; i < 40; i += 1) monitor.record(30);
  let dropped = false;
  for (let i = 0; i < 10; i += 1) dropped = monitor.record(16) || dropped;
  assert.equal(dropped, true); // the average of the window is under 55.5 frames a second
  for (let i = 0; i < 50; i += 1) assert.equal(monitor.record(16), false);
});

test('TIERS lower the pixel ratio, then the dots', () => {
  assert.deepEqual(TIERS.map((tier) => tier.pixelRatio), [2, 1.5, 1]);
  assert.ok(TIERS[2].rows < TIERS[0].rows);
});
