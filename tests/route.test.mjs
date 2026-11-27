// Which clicks Home and the page Map handle in place, src/globe/route.js (node --test).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { viewOf, viewOfClick } from '../src/globe/route.js';

const urls = { home: '/', map: '/map/' };
const origin = 'https://theplanet.observer';
const link = (href, extra = {}) => ({ href, target: '', hasAttribute: (name) => name in extra, ...extra });
const click = (extra = {}) => ({ button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false, ...extra });

test('viewOf knows the two pages, with or without index.html or the last slash', () => {
  assert.equal(viewOf('/', urls), 'home');
  assert.equal(viewOf('/index.html', urls), 'home');
  assert.equal(viewOf('/map/', urls), 'map');
  assert.equal(viewOf('/map', urls), 'map');
  assert.equal(viewOf('/map/index.html', urls), 'map');
  assert.equal(viewOf('/about/', urls), null);
  assert.equal(viewOf('/globe/', urls), null);
});

test('viewOf follows a base URL', () => {
  const based = { home: '/thesite/', map: '/thesite/map/' };
  assert.equal(viewOf('/thesite/', based), 'home');
  assert.equal(viewOf('/thesite/map/', based), 'map');
  assert.equal(viewOf('/', based), null);
});

test('a plain click on a link to Home or Map is handled in place', () => {
  assert.equal(viewOfClick(link('https://theplanet.observer/map/'), click(), origin, urls), 'map');
  assert.equal(viewOfClick(link('/'), click(), origin, urls), 'home');
  assert.equal(viewOfClick(link('/about/'), click(), origin, urls), null);
});

test('the browser keeps the clicks it should: other sites, new tabs, modifiers, other buttons', () => {
  assert.equal(viewOfClick(link('https://www.openstreetmap.org/'), click(), origin, urls), null);
  assert.equal(viewOfClick(link('/map/', { target: '_blank' }), click(), origin, urls), null);
  assert.equal(viewOfClick(link('/map/', { download: '' }), click(), origin, urls), null);
  for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) assert.equal(viewOfClick(link('/map/'), click({ [key]: true }), origin, urls), null);
  assert.equal(viewOfClick(link('/map/'), click({ button: 1 }), origin, urls), null);
  assert.equal(viewOfClick(link('/map/'), click({ defaultPrevented: true }), origin, urls), null);
  assert.equal(viewOfClick(link('/map/?q=1'), click(), origin, urls), null);
  assert.equal(viewOfClick(null, click(), origin, urls), null);
});
