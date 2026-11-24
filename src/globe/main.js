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
  Vector3,
  WebGLRenderer,
} from 'three';

import { DEG, FrameMonitor, TIERS, landDots, startLongitude, toCartesian } from './geometry.js';

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
