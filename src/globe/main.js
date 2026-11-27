// The globe of the home page and the map of the page Map (docs/_includes/world.html): two pages,
// / and /map/, and two views of one document. Following a link from one to the other plays the
// transition of transition.js and changes the address with the History API; a page loaded
// directly shows its own view. esbuild bundles this file, three.js and Leaflet into
// docs/assets/bundle/globe.js (scripts/bundle.sh).
//
// The globe (scene.js): drag it, or use the arrow keys, to turn it; it pauses while off-screen
// or while the tab is hidden, and follows prefers-reduced-motion. The latest edits to
// OpenStreetMap come with the page (the build), then every 19 minutes from live.js. The map
// (map.js) is created only when it is shown, so that Home asks nothing of the tile servers.

import { DEG, FrameMonitor, relay, startLongitude } from './geometry.js';
import { liveEdits } from './live.js';
import { createMap } from './map.js';
import { viewOf, viewOfClick } from './route.js';
import { TILT, createScene } from './scene.js';
import { closing, opening } from './transition.js';

const SPIN = 0.06; // radians a second
const MAX_FLING = 3; // radians a second, the most a drag can throw the globe
const HOME_STATE = Object.freeze({ morph: 0, tint: 0, fill: 0, zoom: 1, edges: 1 });
const MAP_STATE = Object.freeze({ morph: 1, tint: 1, fill: 1, zoom: 1, edges: 0 });

function readMask(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => reject(new Error(`land mask not loaded: ${url}`));
    image.src = url;
  });
}

// The snapshot of the latest edits to OpenStreetMap, made by the build (scripts/osm-activity.py):
// { edits: [{ lat, lon, changes, closed }], sequence }; no edits when the build had no network.
function readActivity() {
  try {
    const activity = JSON.parse(document.getElementById('activity')?.textContent || 'null');
    const edits = Array.isArray(activity?.edits) ? activity.edits : [];
    return { edits: edits.filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lon)), sequence: activity?.sequence };
  } catch {
    return { edits: [], sequence: null };
  }
}

// The places of docs/_data/coverage.yml: { name, lat, lon }.
function readPlaces() {
  try {
    const places = JSON.parse(document.getElementById('coverage')?.textContent || '[]');
    return Array.isArray(places) ? places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)) : [];
  } catch {
    return [];
  }
}

// The caption under the globe: how many edits, and as of when, in the time zone of the visitor.
const CAPTION_TIME = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
function showCaption(count, asOf) {
  for (const element of document.querySelectorAll('[data-edits-sentence]')) element.hidden = false;
  for (const element of document.querySelectorAll('[data-edits-missing]')) element.remove();
  for (const element of document.querySelectorAll('[data-edits-count]')) element.textContent = String(count);
  for (const element of document.querySelectorAll('[data-edits-time]')) {
    element.setAttribute('datetime', asOf.toISOString());
    element.textContent = CAPTION_TIME.format(asOf);
  }
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerpBox = (a, b, t) => ({ left: lerp(a.left, b.left, t), top: lerp(a.top, b.top, t), width: lerp(a.width, b.width, t), height: lerp(a.height, b.height, t) });
// The angle equal to `target` modulo a turn, nearest to `current`: the globe turns the short way.
const nearest = (current, target) => target + Math.round((current - target) / (2 * Math.PI)) * 2 * Math.PI;

function start(world) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const urls = { home: world.dataset.homeUrl, map: world.dataset.mapUrl };
  const titles = { home: world.dataset.homeTitle, map: world.dataset.mapTitle };
  const views = { home: world.querySelector('[data-view-name="home"]'), map: world.querySelector('[data-view-name="map"]') };
  const globeBox = world.querySelector('[data-globe]');
  const mapBox = world.querySelector('[data-map]');
  const readout = world.querySelector('[data-map-readout]');
  const places = readPlaces();
  const activity = readActivity();
  let edits = activity.edits;
  globeBox.dataset.edits = String(edits.length);

  let current = world.dataset.view === 'map' ? 'map' : 'home';
  let scene = null;
  let canvas = null;
  let map = null;
  let state = current === 'map' ? { ...MAP_STATE } : { ...HOME_STATE };
  let box = () => (current === 'map' ? mapBox : globeBox).getBoundingClientRect();
  let timeline = null; // the frame function of the running transition, or null
  let busy = false;
  let pending = null; // where to go once the running transition ends
  let underMap = false; // the flat globe stays under the tiles until they have loaded
  let onScreen = true;
  let velocity = 0;
  let drag = null;

  const ensureMap = () => {
    if (!map) map = createMap(mapBox, { tiles: mapBox.dataset.tiles, places, readout, reducedMotion });
    return map;
  };

  // The edits, from the build and then live.js, every 19 minutes while the globe is shown.
  const live = liveEdits({
    initial: edits,
    sequence: activity.sequence,
    onUpdate(nextEdits, asOf, changed) {
      if (changed) {
        edits = nextEdits;
        scene?.setEdits(edits, relay(edits));
        globeBox.dataset.edits = String(edits.length);
      }
      globeBox.dataset.asOf = asOf.toISOString();
      showCaption(edits.length, asOf);
    },
  });

  // The two views share one cell of the grid (assets/css/globe.css), so that both boxes can be
  // measured at any time; the hidden one is invisible and inert. During a transition their texts
  // fade one after the other ([data-fade]), never the boxes.
  const texts = (name) => views[name].querySelectorAll('[data-fade]');
  const showView = (name) => {
    for (const [key, view] of Object.entries(views)) {
      view.classList.toggle('is-hidden', key !== name);
      view.inert = key !== name;
      for (const text of texts(key)) text.style.opacity = '';
    }
  };
  const fadeTexts = (from, to, out, into) => {
    for (const [key, view] of Object.entries(views)) {
      view.classList.remove('is-hidden');
      view.inert = true;
      for (const text of texts(key)) text.style.opacity = String(key === from ? 1 - out : key === to ? into : 0);
    }
  };
  const markMenu = (name) => {
    for (const link of document.querySelectorAll('.sidebar-nav-item')) {
      const on = viewOf(new URL(link.href, location.origin).pathname, urls) === name;
      link.classList.toggle('active', on);
      if (on) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    document.title = titles[name];
    world.dataset.view = name;
  };

  // The canvas lives in the box of the globe; during a transition, and under the tiles while they
  // load, it covers the window instead (z-index under the sidebar and the tiles).
  const windowed = (on) => {
    canvas?.classList.toggle('globe-canvas--window', on);
    monitor.reset();
  };
  const liveOnlyOnHome = () => {
    if (current === 'home' && !busy && onScreen && !document.hidden) live.start();
    else live.stop();
  };
  const loop = () => {
    const active = Boolean(scene && (timeline || underMap || (current === 'home' && onScreen && !document.hidden)));
    if (scene) {
      if (!active) last = null;
      scene.setAnimationLoop(active ? frame : null);
    }
    liveOnlyOnHome();
  };

  // The map settled: the flat globe stays under it until its tiles have loaded or it moves.
  const leaveUnderMap = () => {
    if (!underMap) return;
    underMap = false;
    if (canvas) canvas.style.visibility = '';
    mapBox.classList.add('map--alone');
    windowed(false);
    loop();
  };
  const settle = (name, { focus = true } = {}) => {
    current = name;
    showView(name);
    markMenu(name);
    state = name === 'map' ? { ...MAP_STATE } : { ...HOME_STATE };
    mapBox.style.opacity = '';
    mapBox.classList.toggle('is-live', name === 'map');
    if (name === 'map') {
      ensureMap();
      state.mapY = map.view().y;
      box = () => mapBox.getBoundingClientRect();
      if (canvas) {
        underMap = true;
        mapBox.classList.remove('map--alone');
        windowed(true);
        canvas.style.visibility = 'visible';
        Promise.race([map.loaded(), new Promise((resolve) => mapBox.addEventListener('pointerdown', resolve, { once: true }))]).then(() => {
          if (current === 'map' && !busy) leaveUnderMap();
        });
      } else {
        mapBox.classList.add('map--alone');
      }
    } else {
      underMap = false;
      box = () => globeBox.getBoundingClientRect();
      if (canvas) canvas.style.visibility = '';
      windowed(false);
    }
    if (focus) views[name].querySelector('h1')?.focus({ preventScroll: true });
    loop();
  };

  // Home -> Map.
  const openMap = () => {
    ensureMap(); // the tiles of the first view start loading now, while the globe opens
    underMap = false;
    windowed(true);
    mapBox.classList.remove('map--alone');
    const mapY = map.view().y;
    const from = { y: scene.spin.rotation.y, x: scene.tilt.rotation.x };
    const to = { y: nearest(from.y, 0), x: 0 };
    const globeRect = globeBox.getBoundingClientRect();
    velocity = 0;
    markMenu('map');
    return (t) => {
      const s = opening(t);
      scene.spin.rotation.y = lerp(from.y, to.y, s.turn);
      scene.tilt.rotation.x = lerp(from.x, to.x, s.turn);
      state = { morph: s.morph, tint: s.tint, fill: s.fill, zoom: s.zoom, edges: s.edges, mapY };
      box = () => lerpBox(globeRect, mapBox.getBoundingClientRect(), s.grow);
      fadeTexts('home', 'map', s.textOut, s.textIn);
      // The tiles fade in over the flat map, which stays opaque under them until they cover it.
      mapBox.style.opacity = String(s.tiles);
      return s.done;
    };
  };

  // Map -> Home: first back to the first view of the map, then the same steps backwards.
  const closeMap = async () => {
    markMenu('home');
    await map.reset();
    underMap = false;
    mapBox.classList.remove('map--alone', 'is-live');
    if (canvas) canvas.style.visibility = 'visible';
    windowed(true);
    const mapY = map.view().y;
    const from = { y: nearest(scene.spin.rotation.y, 0), x: 0 };
    const to = { y: nearest(from.y, -startLongitude(new Date().getTimezoneOffset()) * DEG), x: TILT };
    const globeRect = globeBox.getBoundingClientRect();
    return (t) => {
      const s = closing(t);
      scene.spin.rotation.y = lerp(to.y, from.y, s.turn);
      scene.tilt.rotation.x = lerp(to.x, from.x, s.turn);
      state = { morph: s.morph, tint: s.tint, fill: s.fill, zoom: s.zoom, edges: s.edges, mapY };
      box = () => lerpBox(globeRect, mapBox.getBoundingClientRect(), s.grow);
      fadeTexts('map', 'home', s.textOut, s.textIn);
      mapBox.style.opacity = String(s.tiles);
      return s.done;
    };
  };

  async function go(name) {
    if (name === current && !busy) return;
    if (busy) {
      pending = name;
      return;
    }
    const animated = scene && !reducedMotion && name !== current;
    if (animated) {
      busy = true;
      liveOnlyOnHome();
      const step = name === 'map' ? openMap() : await closeMap();
      await new Promise((resolve) => {
        const started = performance.now();
        // For checks only: window.__globeSlow = 6 plays the transition six times slower.
        timeline = (now) => step((now - started) / (window.__globeSlow || 1)) && resolve();
        loop();
      });
      timeline = null;
      busy = false;
      settle(name);
    } else {
      settle(name);
    }
    if (pending && pending !== current) {
      const next = pending;
      pending = null;
      go(next);
    } else {
      pending = null;
    }
  }

  // Links between the two pages play the transition in place; any other link loads as usual.
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    const target = viewOfClick(link, event, location.origin, urls);
    if (!target) return;
    event.preventDefault();
    if (viewOf(location.pathname, urls) !== target) history.pushState({ view: target }, '', urls[target]);
    go(target);
  });
  window.addEventListener('popstate', () => go(viewOf(location.pathname, urls) ?? 'home'));
  history.replaceState({ view: current }, '');

  // The frame loop: the transition, the spin, the quality, then the scene in its box.
  const monitor = new FrameMonitor();
  let last = null;
  let shown = false;
  const frame = (time) => {
    const seconds = last === null ? 0 : Math.min(0.1, (time - last) / 1000);
    if (timeline) timeline(time);
    else if (current === 'home' && last !== null && monitor.record(time - last) && scene.lowerQuality()) {
      globeBox.dataset.tier = String(scene.tier());
      globeBox.dataset.dots = String(scene.dots());
    }
    last = time;
    if (!timeline && current === 'home' && !drag) {
      scene.spin.rotation.y += (reducedMotion ? 0 : SPIN) * seconds + velocity * seconds;
      velocity *= Math.pow(0.05, seconds);
    }
    scene.render(box(), { ...state, time, pulse: !reducedMotion });
    const arcs = String(scene.arcs());
    if (globeBox.dataset.arcs !== arcs) globeBox.dataset.arcs = arcs;
    if (!shown && current === 'home') {
      shown = true;
      const duration = reducedMotion ? 0 : 800;
      const placeholder = globeBox.querySelector('.globe-placeholder');
      canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-out', fill: 'forwards' });
      placeholder?.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' }).finished.then(() => placeholder.remove());
      globeBox.classList.add('globe--ready');
    }
  };
  // Rotation by drag (with a little inertia) and by the arrow keys, on Home only.
  const wire = () => {
    canvas.addEventListener('pointerdown', (event) => {
      if (current !== 'home' || busy) return;
      drag = { x: event.clientX, y: event.clientY, t: performance.now() };
      velocity = 0;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const perPixel = Math.PI / Math.max(1, canvas.clientWidth);
      const dx = (event.clientX - drag.x) * perPixel;
      const now = performance.now();
      scene.spin.rotation.y += dx;
      scene.tilt.rotation.x = Math.min(1.1, Math.max(-0.6, scene.tilt.rotation.x + (event.clientY - drag.y) * perPixel));
      // Inertia: the speed of the last move, at most MAX_FLING radians a second, so that pointer
      // events a few milliseconds apart do not send the globe spinning.
      velocity = Math.min(MAX_FLING, Math.max(-MAX_FLING, (dx / Math.max(8, now - drag.t)) * 1000));
      drag = { x: event.clientX, y: event.clientY, t: now };
    });
    const release = () => {
      if (drag && performance.now() - drag.t > 80) velocity = 0; // held still before the release
      drag = null;
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('keydown', (event) => {
      if (current !== 'home' || busy) return;
      const step = 10 * DEG;
      const moves = {
        ArrowLeft: () => (scene.spin.rotation.y -= step),
        ArrowRight: () => (scene.spin.rotation.y += step),
        ArrowUp: () => (scene.tilt.rotation.x = Math.max(-0.6, scene.tilt.rotation.x - step)),
        ArrowDown: () => (scene.tilt.rotation.x = Math.min(1.1, scene.tilt.rotation.x + step)),
      };
      if (moves[event.key]) {
        moves[event.key]();
        event.preventDefault();
      }
    });
  };

  // The page as it was loaded: its own view, without a transition.
  settle(current, { focus: false });

  readMask(globeBox.dataset.land)
    .then((mask) => {
      canvas = document.createElement('canvas');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', globeBox.dataset.label || 'A globe of the Earth, with the land drawn as dots');
      canvas.tabIndex = 0;
      canvas.style.opacity = current === 'home' ? '0' : '';
      globeBox.append(canvas);
      scene = createScene(canvas, { mask, places: places.map((p) => [p.lat, p.lon]), edits, pairs: relay(edits), reducedMotion });
      scene.spin.rotation.y = current === 'map' ? 0 : -startLongitude(new Date().getTimezoneOffset()) * DEG;
      if (current === 'map') scene.tilt.rotation.x = 0;
      globeBox.dataset.dots = String(scene.dots());
      globeBox.dataset.tier = String(scene.tier());
      if (current === 'map') {
        // Loaded on the page Map: the globe appears later, closing from the map, not fading in.
        shown = true;
        globeBox.querySelector('.globe-placeholder')?.remove();
        globeBox.classList.add('globe--ready');
      }
      wire();
      settle(current, { focus: false });
    })
    .catch((error) => {
      scene = null;
      canvas?.remove();
      canvas = null;
      globeBox.classList.add('globe--failed');
      console.warn(`globe: ${error.message}`);
      liveOnlyOnHome();
    });

  // Draw only while the globe is on screen and the tab visible.
  new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    loop();
  }).observe(globeBox);
  document.addEventListener('visibilitychange', loop);
}

const world = document.querySelector('[data-world]');
if (world) start(world);
