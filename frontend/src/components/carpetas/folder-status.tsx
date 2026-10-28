"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { useI18n } from "@/context/i18n-context";
import type { CarpetaSummary } from "@/lib/api";

export function FolderStatus({ carpeta }: { carpeta: CarpetaSummary }) {
  const { t } = useI18n();

  if (carpeta.estado_ciclo === "aprobada")
    return (
      <Badge color="success" size="sm">
        {t("docente.approvedBadge")}
      </Badge>
    );

  if (carpeta.estado_ciclo === "observada")
    return (
      <Badge color="warning" size="sm">
        {t("docente.observedStatus")}
      </Badge>
    );

  if (
    carpeta.estado_ciclo === "enviada" ||
    carpeta.estado_ciclo === "reenviada"
  )
    return (
      <Badge color="primary" size="sm">
        {t("status.inReview")}
      </Badge>
    );

  return (
    <Badge color="gray" size="sm">
      {t("status.draft")}
    </Badge>
  );
}
