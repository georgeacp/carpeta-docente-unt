"use client";

import { BellIcon } from "@/components/common/header/icons";
import { Button } from "@/components/tailgrids/core/button";
import { OverlayWrapper } from "@/components/tailgrids/core/overlay";
import { Popover } from "@/components/tailgrids/core/popover";
import { useI18n } from "@/context/i18n-context";
import { useState } from "react";
import { Dialog, Heading } from "react-aria-components";

export function NotificationsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  return (
    <OverlayWrapper isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        iconOnly
        appearance="outline"
        aria-label={t("common.notifications")}
        className="size-10 rounded-lg border-card-border bg-card-background text-icon-secondary shadow-none"
      >
        <BellIcon />
      </Button>
      <Popover
        placement="bottom end"
        className="w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-card-border bg-card-background p-5"
      >
        <Dialog aria-label={t("common.notifications")} className="outline-none">
          <Heading
            slot="title"
            className="text-sm font-semibold text-text-primary"
          >
            {t("common.notifications")}
          </Heading>
          <div className="py-7 text-center">
            <p className="text-sm font-medium text-text-primary">
              {t("notifications.emptyTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {t("notifications.emptyHint")}
            </p>
          </div>
        </Dialog>
      </Popover>
    </OverlayWrapper>
  );
}
