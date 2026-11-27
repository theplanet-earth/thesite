// The index of a page of text (docs/_layouts/page.html, src/toc/main.js): which of its entries
// is the section being read, and where the index scrolls when it is higher than the window.
// No DOM here, so that node --test can check it (tests/toc.test.mjs).
//
// The entries are the title of the page, then its headings (h2 and h3), in order. The section
// being read is that of the last heading above the reading line, a fixed distance from the top
// of the window; above the first heading it is the title, the introduction of the page. At the
// bottom of a page that scrolls, the last sections may never reach the line: there the section
// is that of the last heading in the window.

/**
 * The entry being read: 0 for the title, 1 + i for heading i. `tops` are the distances of the
 * headings from the top of the window (getBoundingClientRect().top), in the order of the page;
 * `line` that of the reading line; `viewport` the height of the window, and `atBottom` whether
 * a page that scrolls is scrolled to its end.
 */
export function activeEntry({ tops, line, viewport, atBottom = false }) {
  const limit = atBottom ? viewport : line;
  let entry = 0;
  tops.forEach((top, i) => {
    if (top <= limit) entry = i + 1;
  });
  return entry;
}

/** Whether a page is scrolled to its end, within `slack` pixels; never for a page that fits. */
export function scrolledToBottom({ scrollY, viewport, height, slack = 2 }) {
  if (height <= viewport + slack) return false;
  return scrollY + viewport >= height - slack;
}

/**
 * The scroll position of the index that puts an entry in its middle, kept within the range the
 * index can scroll: `itemTop` and `itemHeight` are those of the entry inside the content of the
 * index, `viewHeight` and `scrollHeight` those of the index.
 */
export function centredScroll({ itemTop, itemHeight, viewHeight, scrollHeight }) {
  const max = Math.max(0, scrollHeight - viewHeight);
  const target = itemTop - (viewHeight - itemHeight) / 2;
  return Math.min(max, Math.max(0, Math.round(target)));
}

/**
 * Which edges of the index hide entries, so that they fade out: the top when it is scrolled
 * down, the bottom when there is more below. A pixel of slack absorbs the rounding of browsers.
 */
export function hiddenEdges({ scrollTop, viewHeight, scrollHeight }) {
  return {
    top: scrollTop > 1,
    bottom: scrollTop + viewHeight < scrollHeight - 1,
  };
}

/** Ease in and out (cubic), for the slow scroll of the index: 0 at 0, 1 at 1. */
export function easeInOut(t) {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** How long the index takes to scroll `distance` pixels: slow, between 0.4 and 0.9 seconds. */
export function scrollDuration(distance) {
  return Math.min(900, Math.max(400, 300 + Math.abs(distance) * 2));
}
