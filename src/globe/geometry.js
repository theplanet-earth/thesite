// The pure part of the globe of the home page: where the dots of the land go, which longitude
// faces the visitor first, and when to lower the quality. No three.js and no DOM here, so that
// node --test can check it (tests/globe.test.mjs).
//
// The techniques come from "How we built the GitHub globe" by Tobias Ahlin (GitHub, 2020):
// https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/
// GitHub did not publish the code of its globe; this is a new implementation of what the
// article describes.

export const DEG = Math.PI / 180;

// Quality tiers, from the best: the article caps the pixel ratio at 2, then 1.5, and draws
// about 12,000 dots, then about 8,000. rows is the number of rows of dots from pole to pole.
export const TIERS = Object.freeze([
  Object.freeze({ pixelRatio: 2, rows: 180 }),
  Object.freeze({ pixelRatio: 1.5, rows: 180 }),
  Object.freeze({ pixelRatio: 1, rows: 150 }),
]);

/**
 * Position of a point given in degrees on a sphere of radius r: longitude 0 faces +Z (the
 * camera), north is +Y, east is +X.
 */
export function toCartesian(lat, lon, r) {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  return [r * Math.cos(phi) * Math.sin(lambda), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(lambda)];
}

/**
 * Whether the land mask shows land at a point. The mask is equirectangular, like the result
 * of getImageData: { width, height, data } with four bytes per pixel, land when the first
 * byte (red) is at least 128 (scripts/land-mask.py writes white land on black).
 */
export function isLand(mask, lat, lon) {
  const x = Math.min(mask.width - 1, Math.max(0, Math.floor(((lon + 180) / 360) * mask.width)));
  const y = Math.min(mask.height - 1, Math.max(0, Math.floor(((90 - lat) / 180) * mask.height)));
  return mask.data[(y * mask.width + x) * 4] >= 128;
}

/**
 * The dots of the land, as [lat, lon] pairs: rows from pole to pole, each with as many dots as
 * its circumference holds, so that the dots keep the same spacing at every latitude (the
 * nested loops of the article).
 */
export function landDots(mask, rows) {
  const dots = [];
  for (let i = 0; i < rows; i += 1) {
    const lat = 90 - ((i + 0.5) * 180) / rows;
    const count = Math.max(1, Math.round(2 * rows * Math.cos(lat * DEG)));
    for (let j = 0; j < count; j += 1) {
      const lon = -180 + ((j + 0.5) * 360) / count;
      if (isLand(mask, lat, lon)) dots.push([lat, lon]);
    }
  }
  return dots;
}

/**
 * The longitude to show first, from the time zone of the device rather than from a lookup of
 * the address (as in the article): Date#getTimezoneOffset gives minutes west of UTC, and the
 * Earth turns 15 degrees an hour. The result is in [-180, 180).
 */
export function startLongitude(timezoneOffsetMinutes) {
  const lon = -timezoneOffsetMinutes / 4;
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/**
 * Rows of dots for a globe drawn with a radius of `radiusPixels` CSS pixels: a dot every
 * `spacing` pixels along a meridian, so that a small globe (the body of the mascot) does not
 * crowd its dots into a moiré, within [min, max].
 */
export function rowsFor(radiusPixels, { spacing = 4.5, min = 48, max = 180 } = {}) {
  const rows = Math.round((Math.PI * radiusPixels) / spacing);
  return Math.min(max, Math.max(min, Number.isFinite(rows) ? rows : max));
}

/**
 * The sphere that best fits points given as [x, y, z], by least squares on
 * x² + y² + z² = 2ax + 2by + 2cz + d: { center: [a, b, c], radius }.
 */
export function fitSphere(points) {
  const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  const b = [0, 0, 0, 0];
  for (const [x, y, z] of points) {
    const row = [2 * x, 2 * y, 2 * z, 1];
    const t = x * x + y * y + z * z;
    for (let i = 0; i < 4; i += 1) {
      b[i] += row[i] * t;
      for (let j = 0; j < 4; j += 1) A[i][j] += row[i] * row[j];
    }
  }
  // Gaussian elimination with partial pivoting on the 4 by 4 normal equations.
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < 4; c += 1) {
    let pivot = c;
    for (let r = c + 1; r < 4; r += 1) if (Math.abs(M[r][c]) > Math.abs(M[pivot][c])) pivot = r;
    [M[c], M[pivot]] = [M[pivot], M[c]];
    for (let r = 0; r < 4; r += 1) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 5; k += 1) M[r][k] -= f * M[c][k];
    }
  }
  const [cx, cy, cz, d] = M.map((row, i) => row[4] / row[i]);
  return { center: [cx, cy, cz], radius: Math.sqrt(d + cx * cx + cy * cy + cz * cz) };
}

/**
 * The sphere of the bulk of the points, when some of them belong to something else (the
 * body of the mascot under its cap and glasses): fit, keep the points near the surface,
 * fit again, with a tolerance that narrows at each round.
 */
export function fitBody(points, { rounds = 6, from = 0.2, to = 0.04 } = {}) {
  let sphere = fitSphere(points);
  for (let round = 0; round < rounds; round += 1) {
    const tolerance = from + ((to - from) * round) / Math.max(1, rounds - 1);
    const near = points.filter((p) => Math.abs(Math.hypot(p[0] - sphere.center[0], p[1] - sphere.center[1], p[2] - sphere.center[2]) - sphere.radius) < tolerance * sphere.radius);
    if (near.length < 8) break;
    sphere = fitSphere(near);
  }
  return sphere;
}

/**
 * Watches the duration of the frames and says when to lower the quality: when the last
 * `size` frames averaged fewer than `minFps` frames a second (the article: 55.5 over 50
 * frames). After a drop, the window starts again, so that the next tier gets its own chance.
 */
export class FrameMonitor {
  constructor({ size = 50, minFps = 55.5 } = {}) {
    this.size = size;
    this.minFps = minFps;
    this.times = [];
  }

  reset() {
    this.times = [];
  }

  record(milliseconds) {
    this.times.push(milliseconds);
    if (this.times.length > this.size) this.times.shift();
    if (this.times.length < this.size) return false;
    const average = this.times.reduce((sum, value) => sum + value, 0) / this.size;
    if (1000 / average < this.minFps) {
      this.reset();
      return true;
    }
    return false;
  }
}
