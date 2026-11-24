// The pure part of the globe, src/globe/geometry.js (node --test, run by scripts/test.sh).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FrameMonitor, TIERS, fitBody, fitSphere, isLand, landDots, rowsFor, startLongitude, toCartesian } from '../src/globe/geometry.js';

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

// Points on a sphere, spread by a golden-angle spiral (deterministic).
function spherePoints(center, radius, count) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    points.push([center[0] + radius * r * Math.cos(a), center[1] + radius * y, center[2] + radius * r * Math.sin(a)]);
  }
  return points;
}

test('fitSphere finds the centre and the radius of points on a sphere', () => {
  const { center, radius } = fitSphere(spherePoints([0.05, 1.13, -0.04], 0.46, 500));
  close(+center[0].toFixed(9), 0.05); close(+center[1].toFixed(9), 1.13); close(+center[2].toFixed(9), -0.04);
  close(+radius.toFixed(9), 0.46);
});

test('fitBody ignores a cap on top of the sphere', () => {
  const body = spherePoints([0, 1, 0], 0.5, 2000);
  // A cap: a dense cluster above the sphere, a third as many points.
  const cap = spherePoints([0, 1.55, -0.1], 0.25, 700).filter((p) => p[1] > 1.45);
  const plain = fitSphere([...body, ...cap]);
  const robust = fitBody([...body, ...cap]);
  const error = (s) => Math.hypot(s.center[0], s.center[1] - 1, s.center[2]) + Math.abs(s.radius - 0.5);
  assert.ok(error(robust) < 0.01, `robust fit off by ${error(robust)}`);
  assert.ok(error(robust) < error(plain) / 3, 'the robust fit is much closer than the plain one');
});

test('rowsFor spaces the dots by the size of the globe on screen', () => {
  assert.equal(rowsFor(258), 180); // the globe alone, 560 px wide: the first tier
  assert.equal(rowsFor(130), 91); // the body of the mascot
  assert.equal(rowsFor(20), 48); // never fewer than min
  assert.equal(rowsFor(130, { max: 60 }), 60); // never more than the tier allows
  assert.equal(rowsFor(Number.NaN), 180);
});

test('TIERS lower the pixel ratio, then the dots', () => {
  assert.deepEqual(TIERS.map((tier) => tier.pixelRatio), [2, 1.5, 1]);
  assert.ok(TIERS[2].rows < TIERS[0].rows);
});
