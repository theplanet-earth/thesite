// The transition between the globe of Home and the map of the page Map (the owner, 2026-11-26),
// as values of time, without three.js or the DOM (tests/transition.test.mjs). Home -> Map: the
// spikes and arcs of the edits go, the globe turns to Greenwich and comes closer, its box grows
// into the box of the map while it opens from the back into Web Mercator, its sea and land take
// the colours of the tiles, the dots fill the land, and the tiles fade in over it. Map -> Home
// plays the same steps backwards. Every value is between 0 and 1, but zoom, which is 1 or more.

export const OPEN_MS = 2150;
export const CLOSE_MS = 2250;

const clamp01 = (t) => Math.min(1, Math.max(0, t));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Eased progress of t between `from` and `to`: 0 before, 1 after. */
export const phase = (t, from, to) => ease(clamp01((t - from) / (to - from)));

/**
 * Home -> Map, t milliseconds after the click:
 * edges (spikes, arcs and rings shown), turn (to longitude 0 and no tilt), zoom (the push of
 * the camera), grow (the box, from the globe's to the map's), morph (opened; linear, the shader
 * eases each point), tint (the colours of the tiles), fill (the dots grown into land), textOut
 * and textIn (the texts of the page left and of the page reached), tiles (their opacity).
 */
export function opening(t) {
  return {
    edges: 1 - phase(t, 0, 450),
    turn: phase(t, 0, 700),
    zoom: 1 + 0.35 * phase(t, 0, 650) * (1 - phase(t, 650, 1500)),
    grow: phase(t, 450, 1500),
    morph: clamp01((t - 450) / 1050),
    tint: phase(t, 1250, 1700),
    fill: phase(t, 1350, 1750),
    textOut: phase(t, 100, 550),
    textIn: phase(t, 1100, 1600),
    tiles: phase(t, 1700, OPEN_MS),
    done: t >= OPEN_MS,
  };
}

/** Map -> Home, t milliseconds after the map is back at its first view: the same values. */
export function closing(t) {
  return {
    tiles: 1 - phase(t, 0, 420),
    fill: 1 - phase(t, 380, 800),
    tint: 1 - phase(t, 420, 900),
    grow: 1 - phase(t, 650, 1800),
    morph: 1 - clamp01((t - 650) / 1100),
    textOut: phase(t, 450, 900),
    textIn: phase(t, 1500, 2000),
    zoom: 1 + 0.35 * phase(t, 1150, 1700) * (1 - phase(t, 1700, 2100)),
    turn: 1 - phase(t, 1350, 2100),
    edges: phase(t, 1750, CLOSE_MS),
    done: t >= CLOSE_MS,
  };
}
