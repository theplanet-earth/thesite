// The globe of the home page (docs/index.html): an ocean sphere lit by four lights, the land
// drawn as dots, a halo, and the places of docs/_data/coverage.yml as pulsing rings. esbuild
// bundles it with three.js into docs/assets/bundle/globe.js (scripts/bundle.sh).
//
// After "How we built the GitHub globe" by Tobias Ahlin (GitHub, 2020):
// https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/
// From the article: no texture, a few lights on a sphere; the land as about 12,000 five-sided
// circles in one InstancedMesh, placed by reading a small world map with getImageData; the
// circles fading towards the edge of the globe; a halo drawn by a shader on the back side of a
// sphere 1.15 times larger; antialiasing off; the first longitude from the time zone; a
// placeholder cross-faded into the canvas with the Web Animations API; lower quality when the
// frame rate falls under 55.5 over 50 frames; a landing ring that grows and fades. Not from
// the article: rotation by drag and by keyboard, the pause while the globe is off-screen or
// the tab hidden, and prefers-reduced-motion. The colours are those of the mascot of the logo.

import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  CircleGeometry,
  Color,
  CubicBezierCurve3,
  CylinderGeometry,
  DirectionalLight,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';

import { DEG, FrameMonitor, TIERS, arcControlPoints, landDots, relay, spikeHeight, startLongitude, toCartesian } from './geometry.js';
import { liveEdits } from './live.js';

const RADIUS = 1;
const TILT = 0.35; // radians, to show a little more of the northern hemisphere
const SPIN = 0.06; // radians a second
const MAX_FLING = 3; // radians a second, the most a drag can throw the globe
const COLORS = {
  ocean: 0x1f5fae, // the blue of the mascot
  land: 0x9ccc65, // its green
  halo: 0x7fc8ff,
  place: 0xffa94d, // the orange of its glasses
};
const FORWARD = new Vector3(0, 0, 1);
// The arcs of the edits to OpenStreetMap (issue #1), timed as the merged pull requests of the
// GitHub globe: a new arc every ARC_EVERY seconds grows from one edit to the next in
// ARC_GROW, stays ARC_HOLD, withdraws from its start in ARC_FADE; a ring grows and fades where
// it lands. With prefers-reduced-motion, the last ARC_STILL arcs stand still instead.
const ARC_EVERY = 0.8;
const ARC_GROW = 1.4;
const ARC_HOLD = 0.9;
const ARC_FADE = 1.1;
const ARC_STILL = 12;
const ARC_SEGMENTS = 48;
const ARC_SIDES = 5;

// The dots fade towards the edge of the globe, where they crowd and shimmer (moiré).
const DOT_SHADER = {
  vertexShader: /* glsl */ `
    varying float vFacing;
    void main() {
      vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vec3 outward = normalize(normalMatrix * (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
      vFacing = dot(outward, normalize(-center.xyz));
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    varying float vFacing;
    void main() {
      gl_FragColor = vec4(color, smoothstep(0.0, 0.4, vFacing));
      #include <colorspace_fragment>
    }`,
};

// The halo: the back faces of a larger sphere, brightest next to the globe and fading out.
const HALO_SHADER = {
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    varying vec3 vNormal;
    void main() {
      float rim = clamp(-vNormal.z, 0.0, 1.0);
      gl_FragColor = vec4(color, 1.0) * pow(rim * 2.0, 2.5) * 1.1;
      #include <colorspace_fragment>
    }`,
};

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
// live.js keeps it current while the globe is shown.
function readActivity() {
  try {
    const activity = JSON.parse(document.getElementById('activity')?.textContent || 'null');
    const edits = Array.isArray(activity?.edits) ? activity.edits : [];
    return { edits: edits.filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lon)), sequence: activity?.sequence };
  } catch {
    return { edits: [], sequence: null };
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

function readPlaces() {
  try {
    const places = JSON.parse(document.getElementById('coverage')?.textContent || '[]');
    return Array.isArray(places) ? places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)) : [];
  } catch {
    return [];
  }
}

// Puts an object on the surface at lat, lon, facing outwards (its +Z along the normal).
function place(object, lat, lon, radius) {
  const position = new Vector3(...toCartesian(lat, lon, radius));
  object.position.copy(position);
  object.quaternion.setFromUnitVectors(FORWARD, position.normalize());
  return object;
}

function dotsMesh(mask, rows) {
  const dots = landDots(mask, rows);
  const spacing = (Math.PI * RADIUS) / rows;
  const geometry = new CircleGeometry(spacing * 0.36, 5);
  const material = new ShaderMaterial({
    ...DOT_SHADER,
    uniforms: { color: { value: new Color(COLORS.land) } },
    transparent: true,
    depthWrite: false,
  });
  const mesh = new InstancedMesh(geometry, material, dots.length);
  const dummy = new Object3D();
  dots.forEach(([lat, lon], index) => {
    place(dummy, lat, lon, RADIUS * 1.001).updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function placesGroup(places) {
  const group = new Group();
  const rings = [];
  for (const { lat, lon } of places) {
    const dot = new Mesh(new CircleGeometry(0.014, 24), new MeshBasicMaterial({ color: COLORS.place }));
    const ring = new Mesh(
      new RingGeometry(0.016, 0.022, 48),
      new MeshBasicMaterial({ color: COLORS.place, transparent: true, depthWrite: false }),
    );
    group.add(place(dot, lat, lon, RADIUS * 1.003), place(ring, lat, lon, RADIUS * 1.004));
    rings.push(ring);
  }
  return { group, rings };
}

// One thin orange spike per edit, taller the more it changed (spikeHeight), in one InstancedMesh.
function spikesMesh(edits) {
  const geometry = new CylinderGeometry(0.0035, 0.0035, 1, 6, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2);
  const mesh = new InstancedMesh(geometry, new MeshBasicMaterial({ color: COLORS.place }), Math.max(1, edits.length));
  const dummy = new Object3D();
  edits.forEach(({ lat, lon, changes }, index) => {
    place(dummy, lat, lon, RADIUS);
    dummy.scale.set(1, 1, spikeHeight(changes) * RADIUS);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.count = edits.length;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// The arcs between consecutive edits, drawn by growing and then withdrawing the draw range of
// a tube along a cubic Bezier curve (the technique of the article).
function arcsLayer(initialPairs, parent, reducedMotion) {
  let pairs = initialPairs;
  const material = new MeshBasicMaterial({ color: COLORS.place });
  const ringGeometry = new RingGeometry(0.012, 0.017, 40);
  const live = [];
  const step = ARC_SIDES * 6; // indices of one segment of the tube
  let next = 0;
  let lastSpawn = -Infinity;
  const spawn = (pair, time, full) => {
    const curve = new CubicBezierCurve3(...arcControlPoints(pair[0], pair[1], RADIUS).map((p) => new Vector3(...p)));
    const geometry = new TubeGeometry(curve, ARC_SEGMENTS, 0.0028, ARC_SIDES, false);
    const total = geometry.index.count;
    geometry.setDrawRange(0, full ? total : 0);
    const mesh = new Mesh(geometry, material);
    parent.add(mesh);
    live.push({ mesh, born: time, total, to: pair[1], landed: full, ring: null });
  };
  const clear = () => {
    for (const arc of live.splice(0)) {
      parent.remove(arc.mesh);
      arc.mesh.geometry.dispose();
      if (arc.ring) {
        parent.remove(arc.ring);
        arc.ring.material.dispose();
      }
    }
  };
  if (reducedMotion) pairs.slice(-ARC_STILL).forEach((pair) => spawn(pair, 0, true));
  return {
    count: () => live.length,
    // New edits: the relay goes on through them; the arcs already drawn finish their course.
    setPairs(nextPairs) {
      pairs = nextPairs;
      next = 0;
      if (reducedMotion) {
        clear();
        pairs.slice(-ARC_STILL).forEach((pair) => spawn(pair, 0, true));
      }
    },
    update(time) {
      if (reducedMotion || !pairs.length) return;
      const seconds = time / 1000;
      if (seconds - lastSpawn >= ARC_EVERY) {
        spawn(pairs[next % pairs.length], seconds, false);
        next += 1;
        lastSpawn = seconds;
      }
      for (let i = live.length - 1; i >= 0; i -= 1) {
        const arc = live[i];
        const age = seconds - arc.born;
        const segments = (share) => Math.round(Math.min(1, Math.max(0, share)) * ARC_SEGMENTS) * step;
        if (age < ARC_GROW) {
          arc.mesh.geometry.setDrawRange(0, segments(age / ARC_GROW));
        } else if (age < ARC_GROW + ARC_HOLD) {
          arc.mesh.geometry.setDrawRange(0, arc.total);
        } else if (age < ARC_GROW + ARC_HOLD + ARC_FADE) {
          const start = segments((age - ARC_GROW - ARC_HOLD) / ARC_FADE);
          arc.mesh.geometry.setDrawRange(start, arc.total - start);
        } else {
          parent.remove(arc.mesh);
          arc.mesh.geometry.dispose();
          if (arc.ring) {
            parent.remove(arc.ring);
            arc.ring.material.dispose();
          }
          live.splice(i, 1);
          continue;
        }
        if (age >= ARC_GROW && !arc.landed) {
          arc.landed = true;
          arc.ring = place(new Mesh(ringGeometry, new MeshBasicMaterial({ color: COLORS.place, transparent: true, depthWrite: false })), arc.to[0], arc.to[1], RADIUS * 1.004);
          arc.ringBorn = seconds;
          parent.add(arc.ring);
        }
        if (arc.ring) {
          const share = (seconds - arc.ringBorn) / 1.0;
          if (share >= 1) {
            parent.remove(arc.ring);
            arc.ring.material.dispose();
            arc.ring = null;
          } else {
            arc.ring.scale.setScalar(1 + share * 2.5);
            arc.ring.material.opacity = 1 - share;
          }
        }
      }
    },
  };
}

function fit(camera, width, height) {
  camera.aspect = width / height;
  const vertical = camera.fov * DEG;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
  camera.position.set(0, 0, (RADIUS * 1.2) / Math.sin(Math.min(vertical, horizontal) / 2));
  camera.updateProjectionMatrix();
}

async function start(container) {
  const placeholder = container.querySelector('.globe-placeholder');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mask = await readMask(container.dataset.land);

  const renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  let tier = 0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TIERS[tier].pixelRatio));
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', container.dataset.label || 'A globe of the Earth, with the land drawn as dots');
  canvas.tabIndex = 0;
  canvas.style.opacity = '0';
  container.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  // Four lights and no texture: ambient, a key light from the upper left, a rim from behind
  // on the right, a dim blue fill from below.
  const light = (color, intensity, x, y, z) => {
    const directional = new DirectionalLight(color, intensity);
    directional.position.set(x, y, z);
    return directional;
  };
  scene.add(
    new AmbientLight(0xffffff, 0.35),
    light(0xffffff, 2.2, -3, 2, 4),
    light(COLORS.halo, 1.2, 4, 1, -1),
    light(0x3949ab, 0.8, 0, -4, 2),
  );

  const tilt = new Group();
  const spin = new Group();
  tilt.rotation.x = TILT;
  spin.rotation.y = -startLongitude(new Date().getTimezoneOffset()) * DEG;
  tilt.add(spin);
  scene.add(tilt);

  spin.add(new Mesh(new SphereGeometry(RADIUS, 96, 64), new MeshPhongMaterial({ color: COLORS.ocean, shininess: 12 })));
  const halo = new Mesh(
    new SphereGeometry(RADIUS, 96, 64),
    new ShaderMaterial({
      ...HALO_SHADER,
      uniforms: { color: { value: new Color(COLORS.halo) } },
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  halo.scale.setScalar(1.15);
  scene.add(halo);

  let dots = dotsMesh(mask, TIERS[tier].rows);
  spin.add(dots);
  const { group: placesMesh, rings } = placesGroup(readPlaces());
  spin.add(placesMesh);
  const activity = readActivity();
  let edits = activity.edits;
  let spikes = null;
  const showSpikes = () => {
    if (spikes) {
      spin.remove(spikes);
      spikes.geometry.dispose();
      spikes.material.dispose();
      spikes = null;
    }
    if (edits.length) spin.add((spikes = spikesMesh(edits)));
  };
  showSpikes();
  const arcs = arcsLayer(relay(edits), spin, reducedMotion);
  container.dataset.edits = String(edits.length);
  const live = liveEdits({
    initial: edits,
    sequence: activity.sequence,
    onUpdate(nextEdits, asOf, changed) {
      if (changed) {
        edits = nextEdits;
        showSpikes();
        arcs.setPairs(relay(edits));
        container.dataset.edits = String(edits.length);
      }
      container.dataset.asOf = asOf.toISOString();
      showCaption(edits.length, asOf);
    },
  });
  container.dataset.dots = String(dots.count);
  container.dataset.tier = String(tier);

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    fit(camera, width, height);
  };
  resize();
  new ResizeObserver(resize).observe(container);

  // Rotation by drag (with a little inertia) and by the arrow keys.
  let drag = null;
  let velocity = 0;
  canvas.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, y: event.clientY, t: performance.now() };
    velocity = 0;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const perPixel = Math.PI / Math.max(1, canvas.clientWidth);
    const dx = (event.clientX - drag.x) * perPixel;
    const now = performance.now();
    spin.rotation.y += dx;
    tilt.rotation.x = Math.min(1.1, Math.max(-0.6, tilt.rotation.x + (event.clientY - drag.y) * perPixel));
    // Inertia: the speed of the last move, at most MAX_FLING radians a second, so that
    // pointer events a few milliseconds apart do not send the globe spinning.
    const speed = (dx / Math.max(8, now - drag.t)) * 1000;
    velocity = Math.min(MAX_FLING, Math.max(-MAX_FLING, speed));
    drag = { x: event.clientX, y: event.clientY, t: now };
  });
  const release = () => {
    if (drag && performance.now() - drag.t > 80) velocity = 0; // held still before the release
    drag = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', (event) => {
    const step = 10 * DEG;
    const moves = {
      ArrowLeft: () => (spin.rotation.y -= step),
      ArrowRight: () => (spin.rotation.y += step),
      ArrowUp: () => (tilt.rotation.x = Math.max(-0.6, tilt.rotation.x - step)),
      ArrowDown: () => (tilt.rotation.x = Math.min(1.1, tilt.rotation.x + step)),
    };
    if (moves[event.key]) {
      moves[event.key]();
      event.preventDefault();
    }
  });

  const monitor = new FrameMonitor();
  let last = null;
  let shown = false;
  const frame = (time) => {
    const seconds = last === null ? 0 : Math.min(0.1, (time - last) / 1000);
    if (last !== null && monitor.record(time - last) && tier < TIERS.length - 1) {
      tier += 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TIERS[tier].pixelRatio));
      resize();
      if (TIERS[tier].rows !== TIERS[tier - 1].rows) {
        spin.remove(dots);
        dots.geometry.dispose();
        dots.material.dispose();
        dots = dotsMesh(mask, TIERS[tier].rows);
        spin.add(dots);
        container.dataset.dots = String(dots.count);
      }
      container.dataset.tier = String(tier);
    }
    last = time;
    if (!drag) {
      spin.rotation.y += (reducedMotion ? 0 : SPIN) * seconds + velocity * seconds;
      velocity *= Math.pow(0.05, seconds);
    }
    if (!reducedMotion) {
      const phase = (time / 2000) % 1;
      for (const ring of rings) {
        ring.scale.setScalar(1 + phase * 3);
        ring.material.opacity = 1 - phase;
      }
    }
    arcs.update(time);
    if (container.dataset.arcs !== String(arcs.count())) container.dataset.arcs = String(arcs.count());
    renderer.render(scene, camera);
    if (!shown) {
      shown = true;
      const duration = reducedMotion ? 0 : 800;
      canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-out', fill: 'forwards' });
      placeholder?.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' }).finished.then(() => placeholder.remove());
      container.classList.add('globe--ready');
    }
  };

  // Draw only while the globe is on screen and the tab visible.
  let onScreen = true;
  const update = () => {
    const active = onScreen && !document.hidden;
    if (!active) {
      last = null;
      monitor.reset();
    }
    renderer.setAnimationLoop(active ? frame : null);
    if (active) live.start();
    else live.stop();
  };
  new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    update();
  }).observe(container);
  document.addEventListener('visibilitychange', update);
  update();
}

const container = document.querySelector('[data-globe]');
if (container) {
  start(container).catch((error) => {
    container.classList.add('globe--failed');
    console.warn(`globe: ${error.message}`);
  });
}
