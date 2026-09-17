/**
 * i18n on top of the browser's native `browser.i18n` API
 * (https://wxt.dev/guide/essentials/i18n.html).
 *
 * Translations live in `public/_locales/<locale>/messages.json` (zh_CN / en —
 * underscore form, because Chrome rejects the hyphenated `zh-CN` as a
 * `default_locale`/folder name); WXT copies them into the build output and the
 * browser picks the file that matches its UI language, falling back to the
 * manifest's `default_locale`. Lookups are synchronous in every context
 * (SW, content script, side panel).
 *
 * Two things the native API changes compared to the old dictionary module:
 *
 *  - **Language is the browser's, not the user's.** It cannot be switched at
 *    runtime, so there is no `language` setting any more — anything in-app
 *    that used to follow it (menu rebuilds, reactive `t()`, the panel's
 *    language radio) is now static for the session.
 *  - **Message names only allow `A-Za-z0-9_@`.** Call sites keep using dotted
 *    keys (`preview.pinLimit`); the dots become underscores in messages.json
 *    and `messageName()` does the translation in between.
 *
 * Parameters use positional `$1`/`$2` placeholders: `params` values are
 * substituted in insertion order, so multi-placeholder strings must pass the
 * object with keys in the same order they appear in the message.
 */

/** Map a dotted call-site key to the messages.json message name. */
function messageName(key: string): string {
  return key.replace(/[^a-zA-Z0-9_@]/g, "_");
}

// `wxt prepare` types the first argument as the union of the message names it
// found in `public/_locales`. Call sites pass dynamic keys (`` `trigger.${m}` ``),
// so the wrapper takes a plain string and asserts the converted name. The CI
// locale-parity step is what actually guarantees a name exists.
type MessageName = Parameters<typeof browser.i18n.getMessage>[0];

export function translate(
  key: string,
  params?: Record<string, string | number>,
): string {
  const substitutions = params ? Object.values(params).map(String) : undefined;
  // getMessage() returns "" for an unknown key; showing the raw key makes the
  // gap visible instead of rendering an empty label.
  return browser.i18n.getMessage(messageName(key) as MessageName, substitutions) || key;
}

/**
 * Kept as a factory so the preview/selection/reader systems keep taking an
 * injectable `I18n`, but there is no live language source any more — the
 * browser UI language is fixed for the extension's lifetime.
 */
export function createI18n() {
  return {
    t: (key: string, params?: Record<string, string | number>) =>
      translate(key, params),
  };
}

export type I18n = ReturnType<typeof createI18n>;
