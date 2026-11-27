// The scene of the globe (src/globe/main.js drives it): an ocean sphere lit by four lights, the
// land drawn as dots, a halo, the places of docs/_data/coverage.yml as orange dots with pulsing
// rings, and the edits to OpenStreetMap as orange spikes joined by arcs.
//
// After "How we built the GitHub globe" by Tobias Ahlin (GitHub, 2020):
// https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/
// From the article: no texture, a few lights on a sphere; the land as dots placed by reading a
// small world map with getImageData; the dots fading towards the edge of the globe; a halo drawn
// by a shader on the back side of a sphere 1.15 times larger; antialiasing off; lower quality
// when the frame rate falls; a landing ring that grows and fades. The colours are those of the
// mascot of the logo.
//
// The page Map (the owner, 2026-11-26): every point of the ocean and of the land can move from
// the sphere to the plane of Web Mercator, the projection of the tiles of OpenStreetMap (uMorph,
// 0 the globe, 1 the plane); the sea and the land can take the colours of the Standard tiles
// (uTint) and the dots grow until the land is solid (uFill), so that the tiles fade in over a
// map that already looks like them. The spikes, arcs and rings stay on the sphere: they leave
// before it opens (uEdges). The values over time are in transition.js.

import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  CubicBezierCurve3,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
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
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import { DEG, TIERS, arcControlPoints, landDots, spikeHeight, toCartesian } from './geometry.js';

export const RADIUS = 1;
export const TILT = 0.35; // radians, to show a little more of the northern hemisphere
const FOV = 30;
export const COLORS = {
  ocean: 0x1f5fae, // the blue of the mascot
  land: 0x9ccc65, // its green
  halo: 0x7fc8ff,
  place: 0xffa94d, // the orange of its glasses
  specular: 0x111111,
};
// The colours of OpenStreetMap Carto, the style of the Standard tiles: water and land.
export const OSM_COLORS = { water: 0xaad3df, land: 0xf2efe9 };
// Web Mercator ends at 85.05 degrees; the opened globe stops at 83, above the top of the map box
// on the screens measured (CLAUDE.md, Section 12), so that its poles do not stretch far out of
// the window while it opens and closes.
const OPEN_LATITUDE = 83 * DEG;
const FORWARD = new Vector3(0, 0, 1);

// The arcs of the edits, timed as the merged pull requests of the GitHub globe: a new arc every
// ARC_EVERY seconds grows from one edit to the next in ARC_GROW, stays ARC_HOLD, withdraws from
// its start in ARC_FADE; a ring grows and fades where it lands. With prefers-reduced-motion, the
// last ARC_STILL arcs stand still instead.
const ARC_EVERY = 0.8;
const ARC_GROW = 1.4;
const ARC_HOLD = 0.9;
const ARC_FADE = 1.1;
const ARC_STILL = 12;
const ARC_SEGMENTS = 48;
const ARC_SIDES = 5;

const GLSL = /* glsl */ `
  uniform float uMapY;
  vec3 onSphere(vec2 ll) {
    return vec3(cos(ll.y) * sin(ll.x), sin(ll.y), cos(ll.y) * cos(ll.x));
  }
  // Web Mercator of a sphere of radius 1, the equator 2π long; uMapY is the y at the centre of
  // the map box, which the scene centres on the box.
  vec3 onMap(vec2 ll) {
    float phi = clamp(ll.y, -${OPEN_LATITUDE.toFixed(10)}, ${OPEN_LATITUDE.toFixed(10)});
    return vec3(ll.x, log(tan(0.7853981634 + phi * 0.5)) - uMapY, 0.0);
  }
  // How far a point has opened when the whole map has opened by t: the face towards the visitor
  // flattens first, the far side last, so that the globe opens from the back.
  float opened(vec2 ll, float t) {
    float k = clamp(t * 1.55 - abs(ll.x) / 3.14159265 * 0.55, 0.0, 1.0);
    return k * k * (3.0 - 2.0 * k);
  }
`;

// The ocean: a grid of longitude and latitude, so that each vertex knows where it lies.
function oceanGeometry(cols = 192, rows = 128) {
  const ll = new Float32Array((cols + 1) * (rows + 1) * 2);
  const position = new Float32Array((cols + 1) * (rows + 1) * 3);
  const index = [];
  let k = 0;
  for (let j = 0; j <= rows; j += 1) {
    const lat = (90 - (j * 180) / rows) * DEG;
    for (let i = 0; i <= cols; i += 1) {
      const lon = (-180 + (i * 360) / cols) * DEG;
      ll.set([lon, lat], k * 2);
      position.set([Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)], k * 3);
      k += 1;
    }
  }
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const a = j * (cols + 1) + i;
      const b = a + cols + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('normal', new BufferAttribute(position.slice(), 3));
  geometry.setAttribute('ll', new BufferAttribute(ll, 2));
  geometry.setIndex(index);
  return geometry;
}

// The Phong lighting of the globe; only where the vertices and normals are changes. Its colours
// move from the lit blue to the flat water of the tiles: diffuse to black, emissive to the
// water, so that the opened map has exactly their colour.
function oceanMaterial(uniforms) {
  const material = new MeshPhongMaterial({ color: COLORS.ocean, specular: COLORS.specular, shininess: 12, side: DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMorph = uniforms.uMorph;
    shader.uniforms.uMapY = uniforms.uMapY;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec2 ll;\nuniform float uMorph;\n${GLSL}`)
      .replace('#include <beginnormal_vertex>', 'float mp = opened(ll, uMorph);\nvec3 objectNormal = normalize(mix(onSphere(ll), vec3(0.0, 0.0, 1.0), mp));')
      .replace('#include <begin_vertex>', `vec3 transformed = mix(onSphere(ll) * ${RADIUS.toFixed(1)}, onMap(ll), mp);`);
  };
  return material;
}

// The dots of the land and of the places: small pentagons on the sphere, then on the map. Each
// moves its centre and its frame (east, north, up) from one to the other, and fades towards the
// edge of the globe, where the dots crowd and shimmer (moiré). On the map a dot grows with the
// scale of Mercator (1 / cos of the latitude), and with uFill until it overlaps its neighbours.
const DOT_SHADER = {
  vertexShader: /* glsl */ `
    attribute vec2 ill;
    uniform float uMorph;
    uniform float uFill;
    uniform float uLift;
    uniform float uGrows;
    varying float vFacing;
    ${GLSL}
    void main() {
      float mp = opened(ill, uMorph);
      vec3 up = onSphere(ill);
      vec3 east = vec3(cos(ill.x), 0.0, -sin(ill.x));
      vec3 north = cross(up, east);
      vec3 centre = mix(up * uLift, onMap(ill) + vec3(0.0, 0.0, uLift - 1.0), mp);
      vec3 e = normalize(mix(east, vec3(1.0, 0.0, 0.0), mp));
      vec3 n = normalize(mix(north, vec3(0.0, 1.0, 0.0), mp));
      vec3 u = normalize(mix(up, vec3(0.0, 0.0, 1.0), mp));
      float mercator = 1.0 / max(cos(ill.y), 0.087);
      float size = mix(1.0, mix(mercator, mercator * 2.6, uFill), mp * uGrows);
      vec4 mvCentre = modelViewMatrix * vec4(centre, 1.0);
      vFacing = dot(normalize(normalMatrix * u), normalize(-mvCentre.xyz));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(centre + (e * position.x + n * position.y) * size, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform vec3 tintColor;
    uniform float uTint;
    varying float vFacing;
    void main() {
      gl_FragColor = vec4(mix(color, tintColor, uTint), smoothstep(0.0, 0.4, vFacing));
      #include <colorspace_fragment>
    }`,
};

function dotsMesh(points, radius, color, { lift, grows, tint, sides = 5 }, uniforms) {
  const geometry = new CircleGeometry(radius, sides);
  const ll = new Float32Array(Math.max(1, points.length) * 2);
  points.forEach(([lat, lon], i) => ll.set([lon * DEG, lat * DEG], i * 2));
  geometry.setAttribute('ill', new InstancedBufferAttribute(ll, 2));
  const material = new ShaderMaterial({
    ...DOT_SHADER,
    uniforms: {
      color: { value: new Color(color) },
      tintColor: { value: new Color(tint ?? color) },
      uTint: uniforms.uTint,
      uMorph: uniforms.uMorph,
      uFill: uniforms.uFill,
      uMapY: uniforms.uMapY,
      uLift: { value: lift },
      uGrows: { value: grows ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const mesh = new InstancedMesh(geometry, material, Math.max(1, points.length));
  mesh.count = points.length;
  mesh.frustumCulled = false;
  return mesh;
}

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
    uniform float uOpacity;
    varying vec3 vNormal;
    void main() {
      float rim = clamp(-vNormal.z, 0.0, 1.0);
      gl_FragColor = vec4(color, 1.0) * pow(rim * 2.0, 2.5) * 1.1 * uOpacity;
      #include <colorspace_fragment>
    }`,
};

// Puts an object on the surface at lat, lon, facing outwards (its +Z along the normal).
function onSurface(object, lat, lon, radius) {
  const position = new Vector3(...toCartesian(lat, lon, radius));
  object.position.copy(position);
  object.quaternion.setFromUnitVectors(FORWARD, position.normalize());
  return object;
}

// The pulsing rings of the places (their dots are drawn with the land, so that they move with
// the map).
function ringsGroup(places) {
  const group = new Group();
  const rings = places.map(({ lat, lon }) => {
    const ring = new Mesh(new RingGeometry(0.016, 0.022, 48), new MeshBasicMaterial({ color: COLORS.place, transparent: true, depthWrite: false }));
    group.add(onSurface(ring, lat, lon, RADIUS * 1.004));
    return ring;
  });
  return { group, rings };
}

// One thin orange spike per edit, taller the more it changed (spikeHeight), in one InstancedMesh;
// uEdges lowers them into the ground and raises them again.
function spikesMesh(edits, uniforms) {
  const geometry = new CylinderGeometry(0.0035, 0.0035, 1, 6, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2);
  const material = new MeshBasicMaterial({ color: COLORS.place, transparent: true });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEdges = uniforms.uEdges;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uEdges;')
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.xy, position.z * uEdges);');
  };
  const mesh = new InstancedMesh(geometry, material, Math.max(1, edits.length));
  const dummy = new Object3D();
  edits.forEach(({ lat, lon, changes }, index) => {
    onSurface(dummy, lat, lon, RADIUS);
    dummy.scale.set(1, 1, spikeHeight(changes) * RADIUS);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.count = edits.length;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// The arcs between consecutive edits, drawn by growing and then withdrawing the draw range of a
// tube along a cubic Bezier curve (the technique of the article). Their opacity follows uEdges,
// and no new arc starts while they are leaving.
function arcsLayer(initialPairs, parent, reducedMotion) {
  let pairs = initialPairs;
  const material = new MeshBasicMaterial({ color: COLORS.place, transparent: true });
  const ringGeometry = new RingGeometry(0.012, 0.017, 40);
  const live = [];
  const step = ARC_SIDES * 6; // indices of one segment of the tube
  let next = 0;
  let lastSpawn = -Infinity;
  const spawn = (pair, seconds, full) => {
    const curve = new CubicBezierCurve3(...arcControlPoints(pair[0], pair[1], RADIUS).map((p) => new Vector3(...p)));
    const geometry = new TubeGeometry(curve, ARC_SEGMENTS, 0.0028, ARC_SIDES, false);
    const total = geometry.index.count;
    geometry.setDrawRange(0, full ? total : 0);
    const mesh = new Mesh(geometry, material);
    parent.add(mesh);
    live.push({ mesh, born: seconds, total, to: pair[1], landed: full, ring: null, still: full });
  };
  const drop = (arc) => {
    parent.remove(arc.mesh);
    arc.mesh.geometry.dispose();
    if (arc.ring) {
      parent.remove(arc.ring);
      arc.ring.material.dispose();
      arc.ring = null;
    }
  };
  const clear = () => live.splice(0).forEach(drop);
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
    update(time, edges) {
      material.opacity = edges;
      if (reducedMotion || !pairs.length) return;
      const seconds = time / 1000;
      if (edges > 0.6 && seconds - lastSpawn >= ARC_EVERY) {
        spawn(pairs[next % pairs.length], seconds, false);
        next += 1;
        lastSpawn = seconds;
      }
      for (let i = live.length - 1; i >= 0; i -= 1) {
        const arc = live[i];
        if (arc.still) continue;
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
          drop(arc);
          live.splice(i, 1);
          continue;
        }
        if (age >= ARC_GROW && !arc.landed) {
          arc.landed = true;
          arc.ring = onSurface(new Mesh(ringGeometry, new MeshBasicMaterial({ color: COLORS.place, transparent: true, depthWrite: false })), arc.to[0], arc.to[1], RADIUS * 1.004);
          arc.ringBorn = seconds;
          parent.add(arc.ring);
        }
        if (arc.ring) {
          const share = seconds - arc.ringBorn;
          if (share >= 1) {
            parent.remove(arc.ring);
            arc.ring.material.dispose();
            arc.ring = null;
          } else {
            arc.ring.scale.setScalar(1 + share * 2.5);
            arc.ring.material.opacity = (1 - share) * edges;
          }
        }
      }
    },
  };
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The scene, drawn on `canvas`: { spin, tilt, setEdits(edits, pairs), arcs(), dots(),
 * lowerQuality(), render(box, state) }. `places` are [lat, lon]; `edits` { lat, lon, changes },
 * `pairs` the arcs between them (relay of geometry.js).
 */
export function createScene(canvas, { mask, places, edits, pairs, reducedMotion }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  let tier = 0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TIERS[tier].pixelRatio));
  const uniforms = { uMorph: { value: 0 }, uFill: { value: 0 }, uTint: { value: 0 }, uMapY: { value: 0 }, uEdges: { value: 1 } };

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
  // Four lights and no texture: ambient, a key light from the upper left, a rim from behind on
  // the right, a dim blue fill from below.
  const light = (color, intensity, x, y, z) => {
    const directional = new DirectionalLight(color, intensity);
    directional.position.set(x, y, z);
    return directional;
  };
  scene.add(new AmbientLight(0xffffff, 0.35), light(0xffffff, 2.2, -3, 2, 4), light(COLORS.halo, 1.2, 4, 1, -1), light(0x3949ab, 0.8, 0, -4, 2));

  const tilt = new Group();
  const spin = new Group();
  tilt.rotation.x = TILT;
  tilt.add(spin);
  scene.add(tilt);

  const ocean = new Mesh(oceanGeometry(), oceanMaterial(uniforms));
  ocean.frustumCulled = false;
  spin.add(ocean);
  const landOf = (rows) => dotsMesh(landDots(mask, rows), ((Math.PI * RADIUS) / rows) * 0.36, COLORS.land, { lift: 1.001, grows: true, tint: OSM_COLORS.land }, uniforms);
  let land = landOf(TIERS[tier].rows);
  spin.add(land);
  spin.add(dotsMesh(places, 0.014, COLORS.place, { lift: 1.003, grows: false, sides: 24 }, uniforms));
  const { group: ringsMesh, rings } = ringsGroup(places.map(([lat, lon]) => ({ lat, lon })));
  spin.add(ringsMesh);

  let spikes = null;
  const showSpikes = (list) => {
    if (spikes) {
      spin.remove(spikes);
      spikes.geometry.dispose();
      spikes.material.dispose();
      spikes = null;
    }
    if (list.length) spin.add((spikes = spikesMesh(list, uniforms)));
  };
  showSpikes(edits);
  const arcs = arcsLayer(pairs, spin, reducedMotion);

  const haloOpacity = { value: 1 };
  const halo = new Mesh(
    new SphereGeometry(RADIUS, 96, 64),
    new ShaderMaterial({ ...HALO_SHADER, uniforms: { color: { value: new Color(COLORS.halo) }, uOpacity: haloOpacity }, side: BackSide, blending: AdditiveBlending, transparent: true, depthWrite: false }),
  );
  halo.scale.setScalar(1.15);
  scene.add(halo);

  const black = new Color(0x000000);
  const tones = { ocean: new Color(COLORS.ocean), specular: new Color(COLORS.specular), water: new Color(OSM_COLORS.water) };
  const size = new Vector2();

  return {
    spin,
    tilt,
    setAnimationLoop: (callback) => renderer.setAnimationLoop(callback),
    tier: () => tier,
    dots: () => land.count,
    arcs: () => arcs.count(),
    setEdits(list, nextPairs) {
      showSpikes(list);
      arcs.setPairs(nextPairs);
    },
    /** One tier lower (geometry.js, TIERS), if any: a lower pixel ratio, then fewer dots. */
    lowerQuality() {
      if (tier >= TIERS.length - 1) return false;
      tier += 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TIERS[tier].pixelRatio));
      if (TIERS[tier].rows !== TIERS[tier - 1].rows) {
        spin.remove(land);
        land.geometry.dispose();
        land.material.dispose();
        land = landOf(TIERS[tier].rows);
        spin.add(land);
      }
      return true;
    },
    /**
     * Draws the scene with its box at `box` (a DOMRect of the window): the globe as the site has
     * always framed it at morph 0, the width of the world, 2π, across the box at morph 1 (the
     * first view of the map, mapView of geometry.js). The canvas may be larger than the box: as
     * the globe opens, the scissor keeps the flat map inside its box. state: { morph, tint, fill,
     * zoom (the push of the camera, 1 none), edges, mapY (the Mercator y of the centre of the
     * map), time (for the arcs and the rings, in milliseconds) }.
     */
    render(box, { morph = 0, tint = 0, fill = 0, zoom = 1, edges = 1, mapY = 0, time = performance.now(), pulse = true } = {}) {
      const frame = canvas.getBoundingClientRect();
      if (!frame.width || !frame.height || !box.width || !box.height) return;
      renderer.getSize(size);
      if (size.x !== frame.width || size.y !== frame.height) renderer.setSize(frame.width, frame.height, false);
      const e = Math.min(1, Math.max(0, morph));
      uniforms.uMorph.value = e;
      uniforms.uTint.value = tint;
      uniforms.uFill.value = fill;
      uniforms.uMapY.value = mapY;
      uniforms.uEdges.value = edges;
      haloOpacity.value = (1 - e) * (1 - e);
      ocean.material.color.lerpColors(tones.ocean, black, tint);
      ocean.material.specular.lerpColors(tones.specular, black, tint);
      ocean.material.emissive.lerpColors(black, tones.water, tint);
      // The spikes, the arcs and the rings live on the sphere only.
      if (spikes) {
        spikes.material.opacity = edges;
        spikes.visible = edges > 0.001;
      }
      arcs.update(time, edges);
      const phase = pulse ? (time / 2000) % 1 : 0;
      ringsMesh.visible = edges > 0.001;
      for (const ring of rings) {
        ring.scale.setScalar(1 + phase * 3);
        ring.material.opacity = (pulse ? 1 - phase : 1) * edges;
      }

      const left = box.left - frame.left;
      const top = box.top - frame.top;
      camera.aspect = box.width / box.height;
      const vertical = FOV * DEG;
      const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
      const globe = (RADIUS * 1.2) / Math.sin(Math.min(vertical, horizontal) / 2);
      const map = Math.PI / Math.tan(horizontal / 2);
      camera.position.set(0, 0, RADIUS + (globe + (map - globe) * e - RADIUS) / zoom);
      camera.setViewOffset(box.width, box.height, -left, -top, frame.width, frame.height);
      camera.updateProjectionMatrix();

      // As the globe opens, the part of the canvas it may draw on shrinks to its box: the poles
      // of Mercator reach far beyond it.
      const k = smooth(0.45, 1, e);
      const clip = {
        left: left * k,
        top: top * k,
        right: frame.width + (left + box.width - frame.width) * k,
        bottom: frame.height + (top + box.height - frame.height) * k,
      };
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(k > 0);
      renderer.setScissor(clip.left, frame.height - clip.bottom, clip.right - clip.left, clip.bottom - clip.top);
      renderer.render(scene, camera);
    },
  };
}
