import type { SpeculationMode, PrelookSettings } from '@/utils/storage';

/**
 * Speculation Rules warm-up. While the hover-delay timer counts down, we
 * already tell Chrome to prefetch (or prerender) the hovered URL, so the
 * preview iframe — or an eventual real navigation — starts from a warm cache.
 *
 * Uses only the `document.speculationRules` JS API (Chrome ≥ 125): it is not
 * subject to the page's script CSP and degrades to a silent no-op on
 * Firefox/older Chromium. Inline `<script type="speculationrules">` tags were
 * deliberately avoided for CSP reasons.
 */
interface SpeculationRuleRecord {
  source?: 'heuristics';
  eagerness?: 'immediate' | 'conservative' | 'moderate';
  urls?: string[];
}
interface SpeculationRulesJson {
  prefetch?: SpeculationRuleRecord[];
  prerender?: SpeculationRuleRecord[];
}

export interface SpeculationSystem {
  onIntent(url: string): void;
}

export function createSpeculationSystem(deps: {
  getSettings: () => PrelookSettings;
}): SpeculationSystem {
  let api: { addRules(rules: object): void } | undefined;
  try {
    api = (document as Document & { speculationRules?: typeof api }).speculationRules;
  } catch {
    api = undefined;
  }
  const intentDone = new Set<string>();
  let heuristicsInjected = false;

  function inject(json: SpeculationRulesJson) {
    try {
      api?.addRules(json);
    } catch {
      // Malformed rules or unsupported browser — never break the page.
    }
  }

  function ensureHeuristics(mode: Exclude<SpeculationMode, 'off'>) {
    if (heuristicsInjected) return;
    heuristicsInjected = true;
    const rule: SpeculationRuleRecord = {
      source: 'heuristics',
      // Prerendering is far heavier than prefetching, so keep the heuristics
      // bar high for it and only prefetch on the looser hover signal.
      eagerness: mode === 'prerender' ? 'conservative' : 'moderate',
    };
    inject(mode === 'prerender' ? { prerender: [rule] } : { prefetch: [rule] });
  }

  function onIntent(url: string) {
    const mode = deps.getSettings().speculationMode;
    if (!api || mode === 'off') return;
    ensureHeuristics(mode);
    if (intentDone.has(url)) return;
    intentDone.add(url);
    const rule: SpeculationRuleRecord = { urls: [url], eagerness: 'immediate' };
    inject(mode === 'prerender' ? { prerender: [rule] } : { prefetch: [rule] });
  }

  return { onIntent };
}
