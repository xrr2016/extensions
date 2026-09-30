/**
 * Inline translation via Google's public JSON endpoint.
 *
 * This exists because `translate.google.com` answers with
 * `X-Frame-Options: SAMEORIGIN`: the site can never be embedded in a preview
 * iframe, so the alternative to "open a real tab" is to fetch the translation
 * itself and render it as our own card. The endpoint is the same one Google's
 * own frontend calls, is unauthenticated, and returns
 * `Access-Control-Allow-Origin: *` — which is why no host permission is needed.
 *
 * Runs in the background service worker (fetch from a content script would be
 * subject to the page's CSP and would leak the host origin).
 */

export interface TranslateReply {
  ok: boolean;
  /** The translated text, joined across segments; absent on failure */
  translated?: string;
  /** BCP-47 code Google detected for the source, e.g. "en" */
  sourceLang?: string;
  /** Coarse failure reason — the UI shows one message, this logs the cause */
  error?: string;
}

const TRANSLATE_TIMEOUT_MS = 10_000;
/** Google's endpoint is a GET with the text in the query string; past a few
 *  thousand characters the URL itself starts getting rejected. */
const MAX_TRANSLATE_CHARS = 5000;

/**
 * `r[0]` is a list of `[translated, original, …]` segments (long inputs are
 * split), `r[2]` the detected source language. A 200 response whose shape we
 * don't recognise is treated as a failure rather than rendering nothing.
 */
function parseTranslateResponse(body: unknown): TranslateReply {
  if (!Array.isArray(body)) return { ok: false, error: "bad-payload" };
  const segments = body[0];
  if (!Array.isArray(segments) || segments.length === 0) {
    return { ok: false, error: "empty-result" };
  }
  const translated = segments
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
    .join("");
  if (!translated.trim()) return { ok: false, error: "empty-result" };
  const sourceLang = typeof body[2] === "string" ? body[2] : undefined;
  return { ok: true, translated, sourceLang };
}

export async function translateText(text: string, to: string): Promise<TranslateReply> {
  const trimmed = text.trim();
  if (!trimmed || !to) return { ok: false, error: "bad-request" };
  const clipped = trimmed.slice(0, MAX_TRANSLATE_CHARS);
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=auto&dt=t&tl=${encodeURIComponent(to)}` +
    `&q=${encodeURIComponent(clipped)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, credentials: "omit" });
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    return parseTranslateResponse(await res.json());
  } catch (error) {
    return { ok: false, error: String(error) };
  } finally {
    clearTimeout(timer);
  }
}
