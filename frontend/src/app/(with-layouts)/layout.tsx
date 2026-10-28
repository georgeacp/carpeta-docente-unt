"use client";

import Header from "@/components/common/header";
import Sidebar from "@/components/common/sidebar";
import {
  SheetContent,
  SheetOverlay,
  SheetTitle,
} from "@/components/tailgrids/core/sheet";
import { Spinner } from "@/components/tailgrids/core/spinner";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function WithLayout({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  // XL+ sidebar expand/collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Mobile sheet open state (< xl breakpoint)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace("/login");
    }
  }, [cargando, usuario, router]);

  if (cargando) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background-gray-secondary_alt_2">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs font-medium text-text-tertiary">
            {t("common.verifyingSession")}
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-dvh">
      {/*  Desktop sidebar (xl+) — always in DOM, toggles width  */}
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-card-border xl:block",
          isSidebarOpen ? "w-64" : "w-20",
        )}
      >
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </aside>

      {/*  Mobile sidebar (< xl) — Sheet sliding from the left  */}

      <SheetOverlay
        isOpen={isMobileSheetOpen}
        onOpenChange={setIsMobileSheetOpen}
      >
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-67.5! max-w-67.5! border-r border-card-border bg-card-surface-area p-0"
        >
          <SheetTitle className="sr-only">{t("common.openMenu")}</SheetTitle>
          <Sidebar
            isSidebarOpen={true}
            toggleSidebar={() => {
              setIsMobileSheetOpen(false);
            }}
            onItemClick={() => {
              setIsMobileSheetOpen(false);
            }}
            isMobileSheet
          />
        </SheetContent>
      </SheetOverlay>

      {/*  Main content column  */}
      <div className="min-w-0 flex-1">
        <div className="flex h-full flex-col overflow-hidden bg-card-surface-area">
          <Header onMenuClick={() => setIsMobileSheetOpen(true)} />

          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-384 pb-5">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
