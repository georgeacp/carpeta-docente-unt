"use client";

import { MoonIcon, SunIcon } from "@/components/common/header/icons";
import { Button } from "@/components/tailgrids/core/button";
import { useI18n } from "@/context/i18n-context";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      aria-label={t("common.theme")}
      iconOnly
      appearance="outline"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="size-10 rounded-lg border border-card-border bg-card-background text-icon-primary shadow-none outline-none focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 [&>svg]:size-auto"
    >
      <span className="hidden in-data-[theme=dark]:block">
        <SunIcon />
      </span>
      <span className="in-data-[theme=dark]:hidden">
        <MoonIcon />
      </span>
    </Button>
  );
}
