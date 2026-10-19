"use client";

import { useI18n } from "@/context/i18n-context";
import { cn } from "@/utils/cn";
import { Globe2 } from "@tailgrids/icons";
import React from "react";
import { toast } from "sonner";

export default function LanguageSwitcher() {
  const { locale, toggleLocale } = useI18n();

  const handleToggle = () => {
    const nextLocale = locale === "es" ? "en" : "es";
    toggleLocale();
    toast.success(
      nextLocale === "en" ? "Language switched to English" : "Idioma cambiado a Español",
      { duration: 1500 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-lg border border-card-border bg-card-background px-3 shadow-xs transition-colors outline-none cursor-pointer select-none",
        "hover:bg-background-gray-primary",
        "focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 active:scale-95"
      )}
      aria-label={locale === "es" ? "Cambiar a Inglés" : "Switch to Spanish"}
      title={locale === "es" ? "Cambiar a Inglés" : "Switch to Spanish"}
    >
      <Globe2 className="size-4 text-icon-secondary" />
      <span className="text-xs font-semibold uppercase text-text-primary tracking-wider">
        {locale === "es" ? "ES" : "EN"}
      </span>
    </button>
  );
}
