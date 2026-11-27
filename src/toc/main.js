// The index of a page of text (the owner, 2026-11-26): the title of the page and its headings,
// built from the page itself into the <nav data-toc> of docs/_layouts/page.html. On wide
// screens it stays beside the text while the page scrolls and marks the section being read
// (src/toc/spy.js); when it is higher than the window, it scrolls by itself, slowly, to keep
// that section in its middle, and the wheel scrolls it alone while the pointer is over it,
// without a visible scrollbar (assets/css/page.css). On narrow screens it is a list of the
// sections under the title. Without JavaScript the page has no index, and nothing else changes.
// Nothing is stored, and nothing is asked of another host.

import {
  activeEntry, centredScroll, easeInOut, hiddenEdges, scrollDuration, scrolledToBottom,
} from './spy.js';

const nav = document.querySelector('[data-toc]');
const title = document.querySelector('[data-toc-title]');
const body = document.querySelector('[data-toc-body]');
const headings = body ? [...body.querySelectorAll('h2[id], h3[id]')] : [];

if (nav && title && headings.length > 0) start();

function start() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // The entries: the title, which leads to the top of the page, then the headings.
  const label = document.createElement('p');
  label.className = 'toc-label';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = nav.getAttribute('aria-label') || 'Contents';
  const list = document.createElement('ol');
  const targets = [{ text: title.textContent, hash: '#top', className: 'toc-title' }]
    .concat(headings.map((heading) => ({
      text: heading.textContent,
      hash: `#${heading.id}`,
      className: heading.tagName === 'H3' ? 'toc-sub' : '',
    })));
  const links = targets.map(({ text, hash, className }) => {
    const item = document.createElement('li');
    if (className) item.className = className;
    const link = document.createElement('a');
    link.href = hash;
    link.textContent = text.trim();
    item.append(link);
    list.append(item);
    return link;
  });
  nav.append(label, list);
  nav.dataset.sections = String(headings.length);
  nav.hidden = false;

  // An entry chosen by its link, or by the address of the page, stays marked until the reader
  // scrolls, or until its heading, once reached, leaves the window: near the end of a page a
  // short section cannot reach the reading line, and the rule of the bottom would mark the last
  // one instead.
  let chosen = null;
  const entryOf = (hash) => links.findIndex((link) => link.hash === hash);
  const choose = (hash) => {
    const entry = entryOf(hash);
    chosen = entry > 0 ? { entry, reached: false } : null;
  };
  links.forEach((link) => link.addEventListener('click', () => choose(link.hash)));
  addEventListener('hashchange', () => { choose(location.hash); schedule(); });
  choose(location.hash);
  const release = () => { chosen = null; schedule(); };
  for (const type of ['wheel', 'touchmove', 'keydown']) {
    addEventListener(type, (event) => {
      if (!nav.contains(event.target)) release();
    }, { passive: true });
  }

  // The slow scroll of the index, which the wheel interrupts.
  let animation = 0;
  const scrollIndexTo = (target) => {
    cancelAnimationFrame(animation);
    const from = nav.scrollTop;
    const distance = target - from;
    if (Math.abs(distance) < 1) return;
    if (reducedMotion.matches) {
      nav.scrollTop = target;
      return;
    }
    const duration = scrollDuration(distance);
    const begin = performance.now();
    const step = (now) => {
      const t = (now - begin) / duration;
      nav.scrollTop = from + distance * easeInOut(t);
      if (t < 1) animation = requestAnimationFrame(step);
    };
    animation = requestAnimationFrame(step);
  };
  nav.addEventListener('wheel', () => cancelAnimationFrame(animation), { passive: true });

  const overflows = () => nav.scrollHeight > nav.clientHeight + 1;
  const follow = (link) => {
    // Never under the pointer of a reader who is scrolling the index by hand.
    if (!overflows() || nav.matches(':hover')) return;
    const item = link.parentElement;
    scrollIndexTo(centredScroll({
      itemTop: item.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop,
      itemHeight: item.offsetHeight,
      viewHeight: nav.clientHeight,
      scrollHeight: nav.scrollHeight,
    }));
  };

  const fade = () => {
    const edges = hiddenEdges({
      scrollTop: nav.scrollTop, viewHeight: nav.clientHeight, scrollHeight: nav.scrollHeight,
    });
    const value = [edges.top && 'top', edges.bottom && 'bottom'].filter(Boolean).join(' ');
    if (value) nav.dataset.fade = value;
    else delete nav.dataset.fade;
  };
  nav.addEventListener('scroll', fade, { passive: true });

  let active = -1;
  const mark = (entry) => {
    if (entry === active) return;
    if (active >= 0) links[active].removeAttribute('aria-current');
    links[entry].setAttribute('aria-current', 'location');
    active = entry;
    follow(links[entry]);
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    const viewport = innerHeight;
    const tops = headings.map((heading) => heading.getBoundingClientRect().top);
    if (chosen) {
      const top = tops[chosen.entry - 1];
      const inWindow = top >= 0 && top <= viewport;
      if (inWindow) chosen.reached = true;
      else if (chosen.reached) chosen = null;
    }
    const entry = chosen?.entry ?? activeEntry({
      tops,
      line: viewport * 0.3,
      viewport,
      atBottom: scrolledToBottom({
        scrollY, viewport, height: document.documentElement.scrollHeight,
      }),
    });
    mark(entry);
    fade();
  };
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  update();
}
