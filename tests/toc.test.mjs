// The index of a page of text, src/toc/spy.js (node --test): which section is being read, and
// where the index scrolls when it is higher than the window.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  activeEntry, centredScroll, easeInOut, hiddenEdges, scrollDuration, scrolledToBottom,
} from '../src/toc/spy.js';

test('above the first heading, the title is the section being read', () => {
  assert.equal(activeEntry({ tops: [300, 900, 1500], line: 200, viewport: 800 }), 0);
  assert.equal(activeEntry({ tops: [], line: 200, viewport: 800 }), 0);
});

test('the section is that of the last heading above the reading line', () => {
  assert.equal(activeEntry({ tops: [200, 900, 1500], line: 200, viewport: 800 }), 1);
  assert.equal(activeEntry({ tops: [-400, 150, 700], line: 200, viewport: 800 }), 2);
  assert.equal(activeEntry({ tops: [-1400, -600, -10], line: 200, viewport: 800 }), 3);
});

test('at the bottom of the page, the last heading in the window wins', () => {
  // The last two sections are short: their headings never reach the line.
  const tops = [-900, 350, 600];
  assert.equal(activeEntry({ tops, line: 200, viewport: 800 }), 1);
  assert.equal(activeEntry({ tops, line: 200, viewport: 800, atBottom: true }), 3);
  // A heading below the window does not count, even at the bottom.
  assert.equal(activeEntry({ tops: [-900, 350, 850], line: 200, viewport: 800, atBottom: true }), 2);
});

test('only a page that scrolls has a bottom', () => {
  assert.equal(scrolledToBottom({ scrollY: 1200, viewport: 800, height: 2000 }), true);
  assert.equal(scrolledToBottom({ scrollY: 1199, viewport: 800, height: 2000 }), true);
  assert.equal(scrolledToBottom({ scrollY: 1000, viewport: 800, height: 2000 }), false);
  // A page that fits the window is read from its title.
  assert.equal(scrolledToBottom({ scrollY: 0, viewport: 800, height: 800 }), false);
  assert.equal(scrolledToBottom({ scrollY: 0, viewport: 800, height: 801 }), false);
});

test('the index scrolls to put the entry in its middle', () => {
  assert.equal(centredScroll({ itemTop: 500, itemHeight: 30, viewHeight: 400, scrollHeight: 1200 }), 315);
});

test('the index never scrolls beyond its ends', () => {
  assert.equal(centredScroll({ itemTop: 20, itemHeight: 30, viewHeight: 400, scrollHeight: 1200 }), 0);
  assert.equal(centredScroll({ itemTop: 1170, itemHeight: 30, viewHeight: 400, scrollHeight: 1200 }), 800);
  // An index that fits does not scroll.
  assert.equal(centredScroll({ itemTop: 300, itemHeight: 30, viewHeight: 400, scrollHeight: 400 }), 0);
});

test('the edges that hide entries fade out', () => {
  assert.deepEqual(hiddenEdges({ scrollTop: 0, viewHeight: 400, scrollHeight: 400 }), { top: false, bottom: false });
  assert.deepEqual(hiddenEdges({ scrollTop: 0, viewHeight: 400, scrollHeight: 900 }), { top: false, bottom: true });
  assert.deepEqual(hiddenEdges({ scrollTop: 200, viewHeight: 400, scrollHeight: 900 }), { top: true, bottom: true });
  assert.deepEqual(hiddenEdges({ scrollTop: 500, viewHeight: 400, scrollHeight: 900 }), { top: true, bottom: false });
  assert.deepEqual(hiddenEdges({ scrollTop: 499.5, viewHeight: 400, scrollHeight: 900 }), { top: true, bottom: false });
});

test('the scroll of the index eases in and out', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(0.5), 0.5);
  assert.equal(easeInOut(1), 1);
  assert.ok(easeInOut(0.1) < 0.1);
  assert.ok(easeInOut(0.9) > 0.9);
  assert.equal(easeInOut(-1), 0);
  assert.equal(easeInOut(2), 1);
});

test('the scroll of the index is slow, and longer for a longer way', () => {
  assert.equal(scrollDuration(0), 400);
  assert.equal(scrollDuration(100), 500);
  assert.equal(scrollDuration(-100), 500);
  assert.equal(scrollDuration(5000), 900);
});
