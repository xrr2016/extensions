import zhCN from '@/assets/locales/zh-CN.json';
import en from '@/assets/locales/en.json';
import type { Language } from '@/utils/storage';

type Dict = Record<string, string>;

const DICTS: Record<Language, Dict> = {
  'zh-CN': zhCN as Dict,
  en: en as Dict,
};

export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

/** i18n bound to a live language source (storage watch keeps it fresh) */
export function createI18n(getLang: () => Language) {
  return {
    t: (key: string, params?: Record<string, string | number>) =>
      translate(getLang(), key, params),
  };
}

export type I18n = ReturnType<typeof createI18n>;
