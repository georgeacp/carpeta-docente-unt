"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { CollapsibleGroup } from "@/components/tailgrids/core/collapsible";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { cn } from "@/utils/cn";
import { Logo, LogoWithText, LogoWithTextDark } from "@/utils/icon";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Key } from "react-aria-components";
import { getNavDataByRole } from "./data";
import { CloseIcon, SidebarExpandedIcon, ThreeDots } from "./icon";
import NavItem from "./nav-item";
import { findActiveGroupKey } from "./utils";

export default function Sidebar({
  isSidebarOpen,
  toggleSidebar,
  isMobileSheet = false,
  onItemClick,
}: {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobileSheet?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { usuario, logout } = useAuth();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute navigation data dynamically based on the active role and language
  const navData = useMemo(() => getNavDataByRole(usuario?.rol, t), [usuario?.rol, t]);

  // Compute which group should be open based on the current route
  const activeGroupKey = useMemo(() => findActiveGroupKey(pathname, navData), [pathname, navData]);

  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(
    () => new Set<Key>(activeGroupKey ? [activeGroupKey] : []),
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "flex items-center px-4 pt-7 text-text-primary",
          isSidebarOpen ? "justify-between" : "flex-col justify-center gap-4",
        )}
      >
        <Link href="/" className="flex flex-col gap-0.5">
          {isSidebarOpen ? (
            <>
              {isDark ? <LogoWithTextDark /> : <LogoWithText />}
            </>
          ) : (
            <Logo />
          )}
        </Link>

        <button
          onClick={() => toggleSidebar()}
          className={cn(
            "p-1.5 transition-colors cursor-pointer",
            isMobileSheet
              ? "rounded-lg text-icon-tertiary hover:bg-background-gray-primary hover:text-text-primary"
              : "text-icon-tertiary hover:text-text-secondary",
          )}
          aria-label={isMobileSheet ? "Close sidebar" : "Toggle sidebar"}
        >
          {isMobileSheet ? <CloseIcon /> : <SidebarExpandedIcon />}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "scrollbar-thin flex-1 overflow-y-auto",
          isSidebarOpen ? "mt-6 space-y-6 px-4" : "mt-5 px-2",
        )}
      >
        <CollapsibleGroup expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys}>
          {navData.map((section) => (
            <div key={section.label}>
              {/* Expanded: show section label | Collapsed: show divider between sections */}
              {isSidebarOpen ? (
                <p className="mt-6 mb-3 text-xs font-semibold tracking-wider text-text-tertiary uppercase">
                  {section.label}
                </p>
              ) : (
                section.label && (
                  <span className="flex items-center justify-center pt-6 pb-4 text-icon-secondary">
                    <ThreeDots />
                  </span>
                )
              )}

              <div className={cn("space-y-1", !isSidebarOpen && "space-y-1.5")}>
                {section.items.map((item) => (
                  <NavItem
                    key={item.title}
                    id={item.title}
                    icon={item.icon}
                    label={item.title}
                    href={item.url}
                    items={item.items}
                    collapsed={!isSidebarOpen}
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </CollapsibleGroup>
      </nav>

      {/* Footer — Institutional Info & Clean Logout (No 1-Click Role Switcher) */}
      {isSidebarOpen && (
        <div className="px-4 py-4 border-t border-card-border/60">
          <div className="rounded-xl border border-card-border bg-background-gray-primary/80 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-text-tertiary uppercase">
                {t("common.activeSession")}
              </span>
              <Badge
                size="sm"
                color={
                  usuario?.rol === "admin"
                    ? "success"
                    : usuario?.rol === "revisor"
                      ? "warning"
                      : "primary"
                }
              >
                {usuario?.rol ? t(`roles.${usuario.rol}`).toUpperCase() : t("common.guest").toUpperCase()}
              </Badge>
            </div>
            <p className="truncate text-xs font-medium text-text-primary">
              {usuario?.nombre || t("common.institutionalUser")}
            </p>
            <p className="truncate text-[11px] text-text-tertiary">
              {usuario?.email || "unt.edu.pe"}
            </p>

            <div className="mt-3 pt-2.5 border-t border-card-border flex items-center justify-between">
              <span className="text-[10px] text-text-tertiary font-mono">
                {t("app.systemTag")}
              </span>
              <Button
                size="xs"
                variant="ghost"
                appearance="outline"
                onPress={() => {
                  logout();
                  onItemClick?.();
                }}
                className="text-[11px] cursor-pointer"
              >
                {t("common.logout")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
