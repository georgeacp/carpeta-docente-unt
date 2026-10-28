"use client";

import { Brand } from "@/components/common/brand";
import { Button } from "@/components/tailgrids/core/button";
import { CollapsibleGroup } from "@/components/tailgrids/core/collapsible";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
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
  const { usuario, logout } = useAuth();
  const { t } = useI18n();

  // Compute navigation data dynamically based on the active role and language
  const navData = useMemo(
    () => getNavDataByRole(usuario?.rol, t),
    [usuario?.rol, t],
  );

  // Compute which group should be open based on the current route
  const activeGroupKey = useMemo(
    () => findActiveGroupKey(pathname, navData),
    [pathname, navData],
  );

  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(
    () => new Set<Key>(activeGroupKey ? [activeGroupKey] : []),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "flex items-center px-4 pt-5 pb-3 text-text-primary",
          isSidebarOpen ? "justify-between" : "flex-col justify-center gap-4",
        )}
      >
        <Link href="/" className="rounded-sm">
          <Brand compact={!isSidebarOpen} />
        </Link>

        <button
          onClick={() => toggleSidebar()}
          className={cn(
            "flex min-h-10 min-w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
            isMobileSheet
              ? "rounded-lg text-icon-tertiary hover:bg-background-gray-primary hover:text-text-primary"
              : "text-icon-tertiary hover:text-text-secondary",
          )}
          aria-label={t(
            isMobileSheet ? "common.closeMenu" : "common.toggleSidebar",
          )}
          aria-expanded={isSidebarOpen}
        >
          {isMobileSheet ? <CloseIcon /> : <SidebarExpandedIcon />}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "scrollbar-thin flex-1 overflow-y-auto",
          isSidebarOpen ? "mt-3 space-y-6 px-3" : "mt-5 px-2",
        )}
      >
        <CollapsibleGroup
          expandedKeys={expandedKeys}
          onExpandedChange={setExpandedKeys}
        >
          {navData.map((section) => (
            <div key={section.label}>
              {/* Expanded: show section label | Collapsed: show divider between sections */}
              {isSidebarOpen ? (
                <p className="mt-5 mb-2 px-3 text-xs font-medium text-text-tertiary">
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

      {isSidebarOpen && (
        <div className="mx-4 border-t border-card-border py-5">
          <p className="truncate text-sm font-medium text-text-primary">
            {usuario?.nombre || t("common.institutionalUser")}
          </p>
          <p className="mt-1 truncate text-xs text-text-tertiary">
            {usuario?.rol ? t(`roles.${usuario.rol}`) : t("common.guest")}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              logout();
              onItemClick?.();
            }}
            className="mt-3 -ml-2 justify-start text-text-secondary"
          >
            {t("common.logout")}
          </Button>
        </div>
      )}
    </div>
  );
}
