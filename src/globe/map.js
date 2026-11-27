// The map of the page Map (the owner, 2026-11-26): the Standard tiles of OpenStreetMap in Leaflet
// 1.9.4 (BSD 2-Clause), rectangular, in Web Mercator, as on openstreetmap.org. Its first view is
// the one the opened globe ends on (mapView of geometry.js): the whole width of the world across
// the box, at the fractional zoom log2(width / 256), so that the tiles fade in exactly over it.
//
// Within the tile usage policy (https://operations.osmfoundation.org/policies/tiles/): the URL
// https://tile.openstreetmap.org/{z}/{x}/{y}.png, from docs/_config.yml (the policy recommends
// not to hard-code it); only the tiles of the view on screen, and only once the map is asked
// for: Home creates the map when its link is followed, never before (no prefetch, nothing
// offline); a Referer with every tile; the attribution on the map.

import * as L from 'leaflet';

import { mapView } from './geometry.js';

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function formatLatLon(lat, lon) {
  const f = (v, pos, neg) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;
  return `${f(lat, 'N', 'S')}, ${f(lon, 'E', 'W')}`;
}

/**
 * The map in `element`, with the orange places ({ name, lat, lon }) and the coordinates under
 * the pointer in `readout`: { view(), atHome(), reset(), loaded(), element }.
 */
export function createMap(element, { tiles, places, readout, reducedMotion = false }) {
  const box = () => element.getBoundingClientRect();
  let home = mapView(box().width, box().height);

  const map = L.map(element, {
    zoomSnap: 0,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 90,
    minZoom: home.zoom,
    maxZoom: 19,
    worldCopyJump: true,
    maxBounds: [[-85.0511, -540], [85.0511, 540]],
    maxBoundsViscosity: 1,
  });
  // The tile servers want a Referer (https://wiki.openstreetmap.org/wiki/Blocked): each tile asks
  // for one itself, whatever Referrer-Policy the page came with. The port forwarding of
  // Codespaces serves pages with "same-origin", which sends none to another host, and the
  // servers then answer with the tile "Access blocked" (CLAUDE.md, Section 12).
  const layer = L.tileLayer(tiles, { maxZoom: 19, attribution: ATTRIBUTION, referrerPolicy: 'strict-origin-when-cross-origin' }).addTo(map);
  map.setView([home.lat, 0], home.zoom, { animate: false });

  const markers = places.map(({ name, lat, lon }) =>
    L.circleMarker([lat, lon], { radius: 7, color: '#c25f00', weight: 2, fillColor: '#ffa94d', fillOpacity: 0.95 })
      .bindTooltip(name, { direction: 'top', offset: [0, -6] })
      .addTo(map),
  );

  const atHome = () => {
    const centre = map.getCenter();
    const lon = ((((centre.lng + 180) % 360) + 360) % 360) - 180;
    return Math.abs(map.getZoom() - home.zoom) < 1e-3 && Math.abs(centre.lat - home.lat) < 1e-3 && Math.abs(lon) < 1e-3;
  };

  // The box changes with the window: the first view follows it while nobody has moved the map.
  new ResizeObserver(() => {
    const was = atHome();
    map.invalidateSize({ pan: false });
    home = mapView(box().width, box().height);
    map.setMinZoom(home.zoom);
    if (was) map.setView([home.lat, 0], home.zoom, { animate: false });
  }).observe(element);

  // Where the pointer is, and the zoom, under the map.
  const idle = 'Point at the map to read where you are.';
  let pointer = null;
  const read = () => {
    if (!readout) return;
    if (!pointer) {
      readout.textContent = idle;
      return;
    }
    const { lat, lng } = pointer.wrap();
    readout.textContent = `${formatLatLon(lat, lng)} · zoom ${map.getZoom().toFixed(1)}`;
  };
  map.on('mousemove', (event) => {
    pointer = event.latlng;
    read();
  });
  map.on('zoomend', read);
  map.on('mouseout', () => {
    pointer = null;
    read();
  });
  read();

  let loading = true;
  layer.on('loading', () => (loading = true));
  layer.on('load', () => (loading = false));

  return {
    element,
    /** The first view: { zoom, lat, y } (mapView). */
    view: () => home,
    atHome,
    /** Resolves once the tiles of the view on screen have loaded. */
    loaded: () => (loading ? new Promise((resolve) => layer.once('load', () => resolve())) : Promise.resolve()),
    /** Back to the first view, before the map closes into the globe. */
    reset() {
      for (const marker of markers) marker.closeTooltip();
      pointer = null;
      read();
      if (atHome()) return Promise.resolve();
      return new Promise((resolve) => {
        map.once('moveend', () => resolve());
        if (reducedMotion) map.setView([home.lat, 0], home.zoom, { animate: false });
        else map.flyTo([home.lat, 0], home.zoom, { duration: 0.7 });
      });
    },
  };
}
