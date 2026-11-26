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
 * The height of the spike of an edit with `changes` changes, as a share of the radius: the
 * spikes of the GitHub globe stand for pull requests; here an edit to OpenStreetMap, taller
 * the more it changed, on a logarithmic scale so that a large import does not dwarf the rest.
 */
export function spikeHeight(changes) {
  const n = Math.max(0, Number(changes) || 0);
  return Math.min(0.14, 0.02 + 0.03 * Math.log10(1 + n));
}

/**
 * The arc between two places given as [lat, lon]: the four control points of a cubic Bezier
 * curve on a sphere of radius r, rising higher the farther apart the places are, as the arcs
 * of the GitHub globe do. Each point is [x, y, z]. Antipodal places arc over the north pole.
 */
export function arcControlPoints(from, to, r = 1) {
  const a = toCartesian(from[0], from[1], 1);
  const b = toCartesian(to[0], to[1], 1);
  const cos = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const angle = Math.acos(cos);
  const along = (t) => {
    // Spherical interpolation from a to b; a straight line through the pole when antipodal.
    if (Math.sin(angle) < 1e-6) {
      const mid = angle < 1 ? a : [0, 1, 0];
      const u = t < 0.5 ? t * 2 : (1 - t) * 2;
      const p = (t < 0.5 ? a : b).map((v, i) => v * (1 - u) + mid[i] * u);
      const length = Math.hypot(...p) || 1;
      return p.map((v) => v / length);
    }
    const k0 = Math.sin((1 - t) * angle) / Math.sin(angle);
    const k1 = Math.sin(t * angle) / Math.sin(angle);
    return a.map((v, i) => v * k0 + b[i] * k1);
  };
  const lift = r * (1 + (0.08 + (0.5 * angle) / Math.PI) * 1.33);
  return [a.map((v) => v * r), along(0.25).map((v) => v * lift), along(0.75).map((v) => v * lift), b.map((v) => v * r)];
}

/**
 * The arcs of a relay through the edits, in the order they were made: each edit to the next,
 * leaving out pairs closer than `minDegrees` (an arc too short to see). Edits are
 * { lat, lon }; the result is a list of [from, to] pairs of [lat, lon].
 */
export function relay(edits, { minDegrees = 3 } = {}) {
  const pairs = [];
  for (let i = 0; i + 1 < edits.length; i += 1) {
    const from = [edits[i].lat, edits[i].lon];
    const to = [edits[i + 1].lat, edits[i + 1].lon];
    const a = toCartesian(from[0], from[1], 1);
    const b = toCartesian(to[0], to[1], 1);
    const angle = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    if (angle / DEG >= minDegrees) pairs.push([from, to]);
  }
  return pairs;
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

// The page Map (the owner, 2026-11-26): the globe opens into Web Mercator, the projection of
// the tiles of OpenStreetMap, on a sphere of radius 1, so that the equator keeps its length, 2π.
// Web Mercator ends at MAX_MERCATOR_LATITUDE, where its world is square.
export const MAX_MERCATOR_LATITUDE = (2 * Math.atan(Math.exp(Math.PI)) - Math.PI / 2) / DEG;

/** The y of Web Mercator for a latitude in degrees, on a sphere of radius 1. */
export function mercatorY(lat) {
  const phi = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, lat)) * DEG;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}

/** The latitude in degrees of a y of Web Mercator. */
export function latitudeOfY(y) {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;
}

/**
 * The first view of the map in a box of `width` by `height` pixels, the one the opened globe
 * ends on: the whole width of the world across the box, at the zoom of the tiles
 * log2(width / 256) (a tile is 256 pixels wide), centred on longitude 0 and, as near as the
 * box allows without showing beyond the edge of the world, on `latitude`. Returns { zoom, lat,
 * y }, y being the Mercator y of the centre.
 */
export function mapView(width, height, latitude = 20) {
  const zoom = Math.log2(width / 256);
  const half = (Math.PI * height) / width; // half the height of the box, in Mercator y
  const limit = Math.max(0, Math.PI - half);
  const y = Math.max(-limit, Math.min(limit, mercatorY(latitude)));
  return { zoom, lat: latitudeOfY(y), y };
}
