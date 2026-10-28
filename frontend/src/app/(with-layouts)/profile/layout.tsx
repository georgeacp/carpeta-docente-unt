"use client";

import { useI18n } from "@/context/i18n-context";
import { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return <div className="space-y-6 px-4 py-7 sm:px-7 lg:px-10">
    <h1 className="text-2xl font-semibold text-text-primary">{t("profile.institutionalTitle")}</h1>
    {children}
  </div>;
}
