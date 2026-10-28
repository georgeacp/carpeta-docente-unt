"use client";

import { Brand } from "@/components/common/brand";
import { MenuIcon } from "@/components/common/header/icons";
import ThemeToggle from "@/components/common/header/theme-toggle";
import { UserProfileButton } from "@/components/common/header/user-profile";
import { ThreeDots } from "@/components/common/sidebar/icon";
import { useI18n } from "@/context/i18n-context";
import { cn } from "@/utils/cn";
import { useState } from "react";
import LanguageSwitcher from "./language-switcher";
import { NotificationsButton } from "./notifications";
import SearchBar from "./searchbar";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-card-background focus:px-5 focus:py-3 focus:text-text-primary"
      >
        {t("common.skipContent")}
      </a>
      <header className="relative z-40 w-full shrink-0 border-b border-card-border bg-card-surface-area px-4 py-3 sm:px-7 lg:px-10">
        <div className="flex items-center justify-between gap-3 xl:hidden">
          <button
            id="mobile-menu-toggle"
            onClick={onMenuClick}
            aria-label={t("common.openMenu")}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-icon-secondary transition-colors hover:bg-background-gray-primary"
          >
            <MenuIcon />
          </button>
          <Brand />
          <button
            id="mobile-info-toggle"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label={t("common.quickAccess")}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-quick-access"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg text-icon-secondary transition-colors hover:bg-background-gray-primary",
              isDrawerOpen && "bg-background-gray-secondary",
            )}
          >
            <ThreeDots />
          </button>
        </div>
        <div className="hidden items-center justify-between gap-4 xl:flex">
          <div className="max-w-xs flex-1">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <NotificationsButton />
            <div className="ml-2 border-l border-card-border pl-4">
              <UserProfileButton />
            </div>
          </div>
        </div>
      </header>
      <div
        id="mobile-quick-access"
        inert={!isDrawerOpen}
        aria-hidden={!isDrawerOpen}
        className={cn(
          "grid shrink-0 transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none xl:hidden",
          isDrawerOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border bg-card-surface-area px-4 py-3">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationsButton />
            </div>
            <UserProfileButton />
          </div>
        </div>
      </div>
    </>
  );
}
