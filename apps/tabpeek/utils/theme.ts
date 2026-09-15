import type { ThemeMode } from '@/utils/storage';

export type ResolvedTheme = "light" | "dark";

/** Does the OS ask for a dark UI right now? */
export function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

/** "system" resolves against the OS preference; the other modes are literal. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemPrefersDark() ? 'dark' : 'light';
}

/**
 * Calls `onChange` with the resolved theme now, and again whenever the OS
 * preference changes while `getMode()` still says "system". Returns a disposer.
 */
export function watchTheme(getMode: () => ThemeMode, onChange: (theme: ResolvedTheme) => void): () => void {
  const apply = () => onChange(resolveTheme(getMode()));
  apply();
  if (typeof matchMedia !== 'function') return () => {};
  const query = matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getMode() === 'system') apply();
  };
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}
