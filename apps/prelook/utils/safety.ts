/**
 * Offline link-risk heuristics for the preview header hint.
 *
 * This catches *tricks*, not "this domain is known malicious" — that needs a
 * threat feed this project deliberately does not have. So the wording stays at
 * "worth a look", and the checks are limited to signals with a low false
 * positive rate on ordinary browsing.
 */

export type RiskReason =
  | 'userinfo'
  | 'punycode'
  | 'brandMismatch'
  | 'textMismatch'
  | 'ipHost'
  | 'shortener';

export interface LinkRisk {
  reason: RiskReason;
}

/** Well-known brands and the registrable domain each one actually owns. */
const BRANDS: { token: string; domain: string }[] = [
  { token: 'paypal', domain: 'paypal.com' },
  { token: 'apple', domain: 'apple.com' },
  { token: 'icloud', domain: 'icloud.com' },
  { token: 'google', domain: 'google.com' },
  { token: 'gmail', domain: 'google.com' },
  { token: 'microsoft', domain: 'microsoft.com' },
  { token: 'outlook', domain: 'live.com' },
  { token: 'office', domain: 'office.com' },
  { token: 'amazon', domain: 'amazon.com' },
  { token: 'netflix', domain: 'netflix.com' },
  { token: 'facebook', domain: 'facebook.com' },
  { token: 'instagram', domain: 'instagram.com' },
  { token: 'whatsapp', domain: 'whatsapp.com' },
  { token: 'telegram', domain: 'telegram.org' },
  { token: 'alipay', domain: 'alipay.com' },
  { token: 'taobao', domain: 'taobao.com' },
  { token: 'wechat', domain: 'weixin.qq.com' },
  { token: 'weixin', domain: 'weixin.qq.com' },
  { token: 'binance', domain: 'binance.com' },
  { token: 'coinbase', domain: 'coinbase.com' },
  { token: 'metamask', domain: 'metamask.io' },
  { token: 'dropbox', domain: 'dropbox.com' },
  { token: 'steam', domain: 'steampowered.com' },
];

/** Multi-part public suffixes, so registrableDomain() does not stop one label early. */
const MULTI_SUFFIXES = [
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.au', 'net.au', 'co.jp', 'co.kr', 'com.tw', 'com.hk', 'com.sg', 'com.br',
];

const SHORTENERS = new Set([
  'bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'is.gd', 'ow.ly', 'buff.ly',
  'rebrand.ly', 'cutt.ly', 'shorturl.at', 'rb.gy', 't.ly', 'su.pr', 'v.gd',
  'sourl.cn', 'url.cn', '3.cn', 'dwz.cn', 'mrw.so',
]);

/** Host labels that look like they want credentials rather than content. */
const LURE_WORDS = ['login', 'signin', 'verify', 'secure', 'account', 'wallet', 'support', 'update'];

const DOMAIN_IN_TEXT = /\b((?:[a-z0-9-]+\.)+(?:com|cn|net|org|io|co|me|app|dev|xyz|top|info|biz|ru|uk|de|jp|kr|tk|cc))\b/i;

function labels(host: string): string[] {
  return host.split('.').filter(Boolean);
}

/** Naive registrable domain (last two labels, aware of a few multi-part suffixes). */
export function registrableDomain(host: string): string {
  const parts = labels(host);
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_SUFFIXES.includes(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

function hostOf(url: URL): string {
  return url.hostname.toLowerCase().replace(/\.$/, '');
}

function isIpLiteral(host: string): boolean {
  if (host.startsWith('[')) return true; // IPv6 literal
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/**
 * Assesses a link from the URL plus the anchor's visible text. Returns `null`
 * when nothing stands out.
 */
export function assessLink(href: string, anchorText: string): LinkRisk | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  // https://apple.com@evil.tld/ — the part before `@` is a lie.
  if (url.username || url.password) return { reason: 'userinfo' };

  const host = hostOf(url);
  const domain = registrableDomain(host);

  if (isIpLiteral(host)) return { reason: 'ipHost' };
  if (host.includes('xn--') || /[^\u0000-\u007f]/.test(host)) return { reason: 'punycode' };
  if (SHORTENERS.has(domain) || SHORTENERS.has(host)) return { reason: 'shortener' };

  const flattened = host.replace(/[^a-z0-9]/g, '');
  for (const brand of BRANDS) {
    if (!flattened.includes(brand.token)) continue;
    // The brand appears in the host but the domain does not belong to it.
    if (domain === brand.domain || domain.endsWith(`.${brand.domain}`)) continue;
    if (brand.domain.endsWith(`.${domain}`)) continue; // e.g. host qq.com for weixin.qq.com
    return { reason: 'brandMismatch' };
  }

  // A host that both names a brand it does not own and asks for credentials is
  // the classic phishing shape; either signal alone is enough to flag, but this
  // keeps the reason honest when only lure words are present.
  const lure = labels(host).some((label) => LURE_WORDS.some((w) => label.includes(w)));
  if (lure) {
    const text = anchorText.toLowerCase();
    if (BRANDS.some((b) => text.includes(b.token))) return { reason: 'brandMismatch' };
  }

  // Visible text claims one domain while the link goes somewhere else.
  const claimed = DOMAIN_IN_TEXT.exec(anchorText)?.[1]?.toLowerCase();
  if (claimed) {
    const claimedDomain = registrableDomain(claimed);
    if (claimedDomain !== domain && !domain.endsWith(`.${claimedDomain}`)) {
      return { reason: 'textMismatch' };
    }
  }

  return null;
}
