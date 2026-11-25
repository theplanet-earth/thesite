// When the notice of privacy opens, src/notice/visit.js (node --test): at the start of a visit
// only, without storing anything.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { opensNotice } from '../src/notice/visit.js';

const origin = 'https://theplanet.observer';

test('a visit that starts here opens the notice', () => {
  assert.equal(opensNotice({ referrer: '', origin, navigation: 'navigate' }), true);
  assert.equal(opensNotice({ origin, navigation: 'navigate' }), true);
  assert.equal(opensNotice({ referrer: '', origin }), true);
});

test('a visit that comes from another site opens the notice', () => {
  assert.equal(opensNotice({ referrer: 'https://github.com/theplanet-earth/thesite', origin, navigation: 'navigate' }), true);
  // The preview is another site: its own visit, its own notice.
  assert.equal(opensNotice({ referrer: 'https://theplanet.wtf/', origin, navigation: 'navigate' }), true);
  // The same host on another scheme or port is another origin.
  assert.equal(opensNotice({ referrer: 'http://theplanet.observer/', origin, navigation: 'navigate' }), true);
});

test('a page reached from another page of the site does not open it again', () => {
  assert.equal(opensNotice({ referrer: 'https://theplanet.observer/', origin, navigation: 'navigate' }), false);
  assert.equal(opensNotice({ referrer: 'https://theplanet.observer/about/', origin, navigation: 'navigate' }), false);
  assert.equal(opensNotice({ referrer: 'https://theplanet.observer/privacy/', origin }), false);
});

test('a reload or a step in the history is not a new visit', () => {
  assert.equal(opensNotice({ referrer: '', origin, navigation: 'reload' }), false);
  assert.equal(opensNotice({ referrer: '', origin, navigation: 'back_forward' }), false);
  assert.equal(opensNotice({ referrer: 'https://github.com/', origin, navigation: 'back_forward' }), false);
  assert.equal(opensNotice({ referrer: '', origin, navigation: 'prerender' }), true);
});

test('a referrer that is not an address counts as none', () => {
  assert.equal(opensNotice({ referrer: 'not an address', origin, navigation: 'navigate' }), true);
});
