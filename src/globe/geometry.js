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
