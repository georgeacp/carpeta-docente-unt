"use client";

import { LogoutIcon, UserCircleIcon } from "@/components/common/header/icons";
import { Avatar, AvatarFallback } from "@/components/tailgrids/core/avatar";
import { Badge } from "@/components/tailgrids/core/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { AltArrowDownIcon } from "@/utils/icon";
import Link from "next/link";
import { toast } from "sonner";

export function UserProfileButton() {
  const { usuario, logout } = useAuth();
  const { t } = useI18n();

  const displayName = usuario?.nombre || "Dr. Carlos Alcántara";
  const displayEmail = usuario?.email || "docente@unitru.edu.pe";

  const displayRole = (
    usuario?.rol ? t(`roles.${usuario.rol}`) : "Docente"
  ).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1 cursor-pointer">
        <Avatar>
          <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt">
            {displayName
              .split(" ")
              .filter((part) => !part.endsWith("."))
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        <div className="hidden flex-col items-start text-left sm:flex">
          <span className="text-sm leading-5 font-medium text-text-primary">
            {displayName}
          </span>
          <span className="text-[11px] leading-3 text-text-tertiary">
            UNT · {displayRole}
          </span>
        </div>

        <AltArrowDownIcon className="text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        placement="bottom end"
        className="w-72 overflow-hidden p-0 shadow-3xl"
      >
        <DropdownMenuHeader className="flex w-full items-center justify-start gap-2.5 border-b border-border-secondary-alt px-4 py-3">
          <Avatar size="md">
            <AvatarFallback className="border border-border-secondary-alt bg-background-gray-secondary_alt">
              {displayName
                .split(" ")
                .filter((part) => !part.endsWith("."))
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-text-primary">
              {displayName}
            </span>
            <span className="truncate text-xs text-gray-500">
              {displayEmail}
            </span>
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
            {displayRole}
          </Badge>
        </DropdownMenuHeader>

        <DropdownMenuSection className="p-1.5">
          <DropdownMenuItem
            href="/profile"
            className="cursor-pointer px-3 py-2"
            render={(domProps) =>
              "href" in domProps ? (
                <Link {...domProps} />
              ) : (
                <div {...domProps} />
              )
            }
          >
            <span className="shrink-0 text-icon-secondary group-hover:text-text-primary">
              <UserCircleIcon />
            </span>
            <span className="leading-5 font-medium">{t("nav.myProfile")}</span>
          </DropdownMenuItem>
        </DropdownMenuSection>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onAction={() => {
            logout();
            toast.info(t("common.logoutSuccess"));
          }}
          className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
        >
          <span className="text-icon-secondary group-hover:text-text-primary">
            <LogoutIcon />
          </span>
          <span className="leading-5">{t("common.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
