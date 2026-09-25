import { describe, it, expect } from 'vitest';
import { t, setLocale, getLocale, getTranslations } from '../src/i18n';

describe('Internationalization (i18n) Engine', () => {
  it('defaults to English locale', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('feed')).toBe('Feed Lulu');
    expect(t('energy')).toBe('Energy');
  });

  it('switches to Khmer (ភាសាខ្មែរ) correctly', () => {
    setLocale('km');
    expect(getLocale()).toBe('km');
    expect(t('feed')).toBe('បញ្ចុកចំណី Lulu');
    expect(t('play')).toBe('លេងហ្គេមកម្សាន្ត');
    expect(t('energy')).toBe('ថាមពល');
  });

  it('contains full matching keys in both dictionaries', () => {
    const enDict = getTranslations('en');
    const kmDict = getTranslations('km');

    const enKeys = Object.keys(enDict).sort();
    const kmKeys = Object.keys(kmDict).sort();

    expect(kmKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(15);
  });
});
