/**
 * URL tracking protection: drops marketing/analytics parameters and unwraps
 * known redirect shims, entirely offline.
 *
 * The parameter list is global, so it only contains names that are unambiguous
 * on their own (`utm_*`, `gclid`, `fbclid`, …). Short, generic names that other
 * sites use for real routing (`ref`, `source`, `si`, `s`, `t`) are deliberately
 * left alone — a per-domain ruleset would be the way to cover those, and the
 * cost of stripping a functional parameter is a broken page.
 */

/** Exact parameter names that only ever exist to attribute a visit. */
const TRACKING_PARAMS = new Set([
  'gclid',
  'gclsrc',
  'dclid',
  'gbraid',
  'wbraid',
  'gad_source',
  'fbclid',
  'msclkid',
  'twclid',
  'ttclid',
  'yclid',
  'li_fat_id',
  'igshid',
  'igsh',
  'mc_cid',
  'mc_eid',
  'mkt_tok',
  '_hsenc',
  '_hsmi',
  'vero_id',
  'vero_conv',
  'wickedid',
  'oly_anon_id',
  'oly_enc_id',
  's_cid',
  'sc_cid',
  'elqTrackId',
  'elqTrack',
  's_kwcid',
  'trk',
  'trkCampaign',
  'WT.mc_id',
  'wt_mc',
  '_openstat',
  'at_medium',
  'at_campaign',
  '_ga',
  '_gl',
  '_gac',
  'hsCtaTracking',
]);

/** Namespaced families: every `prefix*` parameter belongs to the same vendor. */
const TRACKING_PREFIXES = ['utm_', 'pk_', 'mtm_', 'hsa_', 'oly_', 'vero_', 'sc_campaign'];

/**
 * Redirect shims: the real destination rides in one query parameter of a
 * well-known wrapper. `path` is part of the match because e.g. google.com/url
 * unwraps but google.com/search must never be touched.
 */
const SHIMS: { host: RegExp; path: RegExp; params: string[] }[] = [
  { host: /^(www\.)?google\.[a-z.]{2,}$/, path: /^\/url$/, params: ['q', 'url'] },
  { host: /^(l|lm)\.facebook\.com$/, path: /^\/l\.php$/, params: ['u'] },
  { host: /^l\.instagram\.com$/, path: /^\/$/, params: ['u'] },
  { host: /^(www\.)?out\.reddit\.com$/, path: /^\/$/, params: ['url'] },
  { host: /^link\.zhihu\.com$/, path: /^\/$/, params: ['target'] },
  { host: /^(www\.)?youtube\.com$/, path: /^\/redirect$/, params: ['q'] },
  { host: /^steamcommunity\.com$/, path: /^\/linkfilter\/$/, params: ['url'] },
  { host: /^(www\.)?duckduckgo\.com$/, path: /^\/l\/$/, params: ['uddg'] },
];

function isTrackingParam(name: string): boolean {
  const key = name.toLowerCase();
  if (TRACKING_PARAMS.has(name) || TRACKING_PARAMS.has(key)) return true;
  return TRACKING_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** True for URLs this module is willing to touch. */
function isHttp(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function shimTarget(url: URL): string | null {
  for (const shim of SHIMS) {
    if (!shim.host.test(url.hostname) || !shim.path.test(url.pathname)) continue;
    for (const name of shim.params) {
      const raw = url.searchParams.get(name);
      if (!raw) continue;
      try {
        const target = new URL(raw);
        if (isHttp(target)) return target.href;
      } catch {
        /* not a URL: keep looking */
      }
    }
  }
  return null;
}

/**
 * Returns the URL with tracking parameters removed and redirect shims unwrapped.
 * Non-http(s) URLs and anything that fails to parse come back untouched.
 */
export function stripTracking(raw: string): string {
  let current = raw;
  // Shims can be nested (a shim pointing at another shim); a couple of passes is
  // plenty and the cap keeps a malicious loop from spinning.
  for (let depth = 0; depth < 3; depth++) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return current;
    }
    if (!isHttp(url)) return current;
    const unwrapped = shimTarget(url);
    if (!unwrapped || unwrapped === current) break;
    current = unwrapped;
  }

  let url: URL;
  try {
    url = new URL(current);
  } catch {
    return current;
  }
  if (!isHttp(url) || !url.search) return current;

  const kept = new URLSearchParams();
  let dropped = false;
  for (const [name, value] of url.searchParams) {
    if (isTrackingParam(name)) {
      dropped = true;
      continue;
    }
    kept.append(name, value);
  }
  if (!dropped) return current;

  const query = kept.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
}
