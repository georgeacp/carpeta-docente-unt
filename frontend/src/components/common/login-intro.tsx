"use client";

import { Brand } from "@/components/common/brand";
import { useI18n } from "@/context/i18n-context";

export function LoginIntro() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col justify-between border-b border-card-border bg-background-gray-primary px-6 py-5 sm:px-9 lg:border-r lg:border-b-0 lg:p-12">
      <Brand />
      <div className="hidden py-16 lg:block">
        <h2 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight text-text-primary">
          {t("login.heroTitle")}
        </h2>
        <p className="mt-5 max-w-sm text-base leading-7 text-text-secondary">
          {t("login.heroPhrase")}
        </p>
      </div>
      <p className="hidden text-xs leading-5 text-text-tertiary lg:block">
        {t("app.faculty")}
      </p>
    </div>
  );
}
