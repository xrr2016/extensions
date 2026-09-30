/** The window header's four icons; static markup, no user input involved. One
 *  thin-stroke set at a 24 grid, so pin / reload / open / close keep the same
 *  weight and optical size. */
const ICON_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
export const PIN_ICON = `<svg ${ICON_ATTRS}><path d="M10 3h4v6l3 3v2H7v-2l3-3z"/><path d="M12 14v7"/></svg>`;
export const RELOAD_ICON = `<svg ${ICON_ATTRS}><polyline points="22 4 22 10 16 10"/><path d="M19.5 15a8 8 0 1 1-1.9-8.3L22 10"/></svg>`;
/** Arrow up and out — the same meaning as the ↗ glyph this replaced. */
export const OPEN_ICON = `<svg ${ICON_ATTRS}><path d="M7 17 17 7"/><polyline points="8 7 17 7 17 16"/></svg>`;
export const CLOSE_ICON = `<svg ${ICON_ATTRS}><path d="M6 6l12 12M18 6 6 18"/></svg>`;
