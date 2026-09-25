import { Locale, Translations } from './types';
import { en } from './en';
import { km } from './km';

export * from './types';

const TRANSLATION_MAP: Record<Locale, Translations> = {
  en,
  km,
};

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getTranslations(locale?: Locale): Translations {
  return TRANSLATION_MAP[locale || currentLocale] || en;
}

export function t(key: keyof Translations, locale?: Locale): string {
  const dict = getTranslations(locale);
  return dict[key] || en[key] || String(key);
}
