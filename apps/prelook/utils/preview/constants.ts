export const IFRAME_LOAD_TIMEOUT_MS = 8_000;
export const AUTO_CLOSE_GRACE_MS = 400;

/** Smallest size the corner grip can drag a window down to. */
export const MIN_RESIZE_W = 240;
export const MIN_RESIZE_H = 160;

/** Backdrop strength (the `blurStrength` percentage) → blur radius and dim. */
export const MAX_BLUR_PX = 14;
export const MAX_DIM = 0.5;

/** Window exit animation length; keep in sync with the .tp-win.tp-out
 *  transition. Only the exit is mirrored here — it is what the teardown waits
 *  for, while the (longer) entrance is pure CSS. */
export const EXIT_MS = 160;
/** Teardown delay after the exit animation; also the "no animation" case's frame
 *  of slack. */
export const FADE_SLACK_MS = 40;

/** How long the "every slot is pinned" notice stays on screen. */
export const NOTICE_MS = 2600;

/** Distance between the pointer and the trigger countdown bar (shared with the
 *  notice toast's placement). */
export const PROGRESS_BAR_GAP = 18;
/** Only used if the bar cannot be measured (display:none fallback). */
export const PROGRESS_BAR_FALLBACK_W = 72;
export const PROGRESS_BAR_FALLBACK_H = 6;
