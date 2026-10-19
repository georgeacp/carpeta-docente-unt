"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nProvider as AriaI18nProvider } from "react-aria-components";
import {
  DEFAULT_LOCALE,
  getTranslation,
  Locale,
  LocaleOption,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locales: LocaleOption[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem("unt_locale");
      if (savedLocale === "es" || savedLocale === "en") {
        setLocaleState(savedLocale);
        document.documentElement.lang = savedLocale;
      } else {
        localStorage.setItem("unt_locale", DEFAULT_LOCALE);
        document.documentElement.lang = DEFAULT_LOCALE;
      }
    } catch {
      // localStorage may fail in restricted environments
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    const target = newLocale === "en" ? "en" : "es";
    setLocaleState(target);
    try {
      localStorage.setItem("unt_locale", target);
      document.documentElement.lang = target;
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "es" ? "en" : "es");
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(locale, key, params);
  };

  const ariaLocale = locale === "es" ? "es-PE" : "en-US";

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t,
        locales: SUPPORTED_LOCALES,
      }}
    >
      <AriaI18nProvider locale={ariaLocale}>{children}</AriaI18nProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n debe utilizarse dentro de un I18nProvider");
  }
  return context;
}
