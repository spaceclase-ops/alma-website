import type React from 'react';

// Internal links are real <a href> elements so search engines and AI crawlers can
// follow them. A plain left click is still handled in-app (no page reload); clicks
// with a modifier key (new tab/window) are left to the browser.
export const isPlainLeftClick = (e: React.MouseEvent) =>
  !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
