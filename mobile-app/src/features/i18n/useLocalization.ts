import { useState, useEffect, useCallback } from 'react';
import { LocaleInfo, Translations } from './types';

const API_BASE = '/api/v1/customer/i18n';

export function useLocalization() {
  const [locale, setLocale] = useState<string>('en-GB');
  const [locales, setLocales] = useState<LocaleInfo[]>([]);
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState(true);

  const fetchLocales = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/locales`, { credentials: 'include' });
      if (res.ok) {
        setLocales(await res.json());
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchTranslations = useCallback(async (localeCode: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/translations`, {
        credentials: 'include',
        headers: { 'Accept-Language': localeCode },
      });
      if (res.ok) {
        setTranslations(await res.json());
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocales();
    fetchTranslations(locale);
  }, [locale, fetchLocales, fetchTranslations]);

  const changeLocale = useCallback((newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem('app_locale', newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[key] || key;
  }, [translations]);

  const formatCurrency = useCallback((amount: number, currency: string = 'EUR'): string => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  }, [locale]);

  const formatDate = useCallback((date: string | Date): string => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale).format(d);
    } catch {
      return String(date);
    }
  }, [locale]);

  const formatNumber = useCallback((num: number): string => {
    try {
      return new Intl.NumberFormat(locale).format(num);
    } catch {
      return String(num);
    }
  }, [locale]);

  // Load saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem('app_locale');
    if (saved) setLocale(saved);
  }, []);

  return {
    locale,
    locales,
    translations,
    loading,
    changeLocale,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
  };
}
