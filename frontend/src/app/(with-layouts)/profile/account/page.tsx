"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { Button } from "@/components/tailgrids/core/button";

export default function AccountPage() {
  const { usuario, refreshUsuario, logout } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    refreshUsuario(controller.signal)
      .then(() => { if (!controller.signal.aborted) setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [refreshUsuario, attempt]);

  if (loading) return <p role="status" className="text-text-secondary">{t("profile.loading")}</p>;

  if (error) return <div role="alert" className="space-y-4 text-text-primary">
    <p>{t("profile.loadError")}</p>
    <Button className="min-h-11" onPress={() => { setLoading(true); setAttempt(attempt + 1); }}>{t("common.retry")}</Button>
  </div>;

  if (!usuario) return null;

  const fields: Array<[string, string | undefined]> = [
    ["profile.institutionalFullName", usuario.nombre],
    ["profile.institutionalEmail", usuario.email],
    ["profile.institutionalRole", t(`profile.role.${usuario.rol}`)],
    ["profile.school", usuario.escuela],
    ["profile.category", usuario.categoria],
  ];

  return <section aria-label={t("profile.institutionalTitle")} className="max-w-3xl space-y-6">
    <p className="text-sm leading-6 text-text-secondary">{t("profile.readOnly")}</p>
    <dl className="divide-y divide-card-border rounded-xl border border-card-border bg-card-background px-5">
      {fields.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-5">
        <dt className="text-sm text-text-secondary">{t(label)}</dt>
        <dd className="min-w-0 break-words font-medium text-text-primary sm:col-span-2">{value || t("profile.notRecorded")}</dd>
      </div>)}
    </dl>
    <Button className="min-h-11" appearance="outline" onPress={logout}>{t("profile.signOutHere")}</Button>
  </section>;
}
