"use client";

import { useI18n } from "@/context/i18n-context";
import { Logo } from "@/utils/icon";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();

  return (
    <span className="flex min-w-0 items-center gap-2.5 text-text-primary">
      <Logo className="h-10 w-11 shrink-0" aria-hidden="true" />
      {!compact && (
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold tracking-tight">
            {t("login.brandName")}
          </span>
          <span className="mt-0.5 text-[10px] leading-4 text-text-secondary">
            {t("login.brandDetail")}
          </span>
        </span>
      )}
      {compact && <span className="sr-only">{t("app.name")}</span>}
    </span>
  );
}
