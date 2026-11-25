// When the notice of privacy opens (docs/_includes/privacy-notice.html): at the start of a
// visit, once, and without storing anything in the browser, so that the page Privacy stays
// true ("stores nothing in your browser"). No DOM here, so that node --test can check it
// (tests/notice.test.mjs); src/notice/main.js reads the browser and opens the dialog.
//
// A visit starts when the page was not reached from another page of the same site: no
// referrer (an address typed, a bookmark, a browser that sends none), or the referrer of
// another site. A reload or a step back or forward in the history is not a new visit, even on
// the first page, whose referrer is still empty then. A browser that never sends a referrer
// shows the notice on every page: the price of remembering nothing.

/** The origin of an address, or null when it is not an absolute address. */
function originOf(address) {
  try {
    return new URL(address).origin;
  } catch {
    return null;
  }
}

/**
 * Whether the notice opens: `referrer` is document.referrer, `origin` that of the page, and
 * `navigation` the type of the navigation entry of the page ("navigate", "reload",
 * "back_forward", "prerender"; undefined where the browser does not say).
 */
export function opensNotice({ referrer = '', origin, navigation } = {}) {
  if (navigation === 'reload' || navigation === 'back_forward') return false;
  return originOf(referrer) !== origin;
}
