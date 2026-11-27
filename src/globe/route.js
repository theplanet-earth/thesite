// Home and the page Map are two pages of the site (/ and /map/), and two views of one document:
// a click from one to the other plays the transition and changes the address with the History
// API instead of loading the other page. Which clicks, without the DOM (tests/route.test.mjs).

const normal = (path) => {
  const trimmed = path.replace(/index\.html$/, '');
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

/** The view a path shows, 'home' or 'map', or null for any other page; urls: { home, map }. */
export function viewOf(pathname, urls) {
  const path = normal(pathname);
  if (path === normal(urls.home)) return 'home';
  if (path === normal(urls.map)) return 'map';
  return null;
}

/**
 * The view a click on a link leads to, when the page may show it in place: a link of the same
 * origin to Home or Map, followed by the main button without a modifier key, not opened
 * elsewhere (target, download). Otherwise null, and the browser follows the link as usual.
 */
export function viewOfClick(link, click, origin, urls) {
  if (!link || click.defaultPrevented || click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null;
  if ((link.target && link.target !== '_self') || link.hasAttribute?.('download')) return null;
  let url;
  try {
    url = new URL(link.href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin || url.search) return null;
  return viewOf(url.pathname, urls);
}
