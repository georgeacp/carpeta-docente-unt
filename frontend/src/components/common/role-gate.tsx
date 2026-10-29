"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { Usuario } from "@/lib/api";

export function RoleGate({
  roles,
  children,
}: {
  roles: Usuario["rol"][];
  children: ReactNode;
}) {
  const { usuario, cargando } = useAuth();
  const { t } = useI18n();

  if (cargando || !usuario)
    return (
      <p role="status" className="p-6 text-text-secondary">
        {t("common.loading")}
      </p>
    );

  if (!roles.includes(usuario.rol))
    return (
      <div className="space-y-4 p-6 text-text-primary">
        <h1 className="text-2xl font-semibold">{t("modules.noAccess")}</h1>
        <Link className="text-brand-600 underline" href={`/${usuario.rol}`}>
          {t("modules.back")}
        </Link>
      </div>
    );

  return children;
}
