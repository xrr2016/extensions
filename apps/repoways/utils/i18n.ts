export function t(key: string): string {
  // `wxt prepare` types getMessage's argument as a literal union of the real
  // message names, so a dynamic key has to be asserted.
  const name = key.replace(/\./g, "_") as Parameters<typeof browser.i18n.getMessage>[0];
  return browser.i18n.getMessage(name) || key;
}
