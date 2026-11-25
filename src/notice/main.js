// The notice of privacy, on every page but the page Privacy itself (the owner, 2026-11-25):
// a modal dialog that opens at the start of a visit (src/notice/visit.js) and keeps the rest
// of the page out of reach until it is closed, by its button or by Escape. showModal makes the
// rest of the page inert and keeps the focus inside the dialog; <form method="dialog"> closes
// it. Without JavaScript, or with a browser without <dialog>, nothing opens and the menu still
// links the page Privacy.

import { opensNotice } from './visit.js';

const dialog = document.querySelector('[data-privacy-notice]');
const [entry] = performance.getEntriesByType?.('navigation') ?? [];

if (dialog && typeof dialog.showModal === 'function'
    && opensNotice({ referrer: document.referrer, origin: location.origin, navigation: entry?.type })) {
  dialog.showModal();
}
