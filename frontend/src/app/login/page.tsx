"use client";

import { LoginIntro } from "@/components/common/login-intro";
import LanguageSwitcher from "@/components/common/header/language-switcher";
import ThemeToggle from "@/components/common/header/theme-toggle";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
} from "@/components/tailgrids/core/alert";
import { Button } from "@/components/tailgrids/core/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/tailgrids/core/input-group";
import { Label } from "@/components/tailgrids/core/label";
import { Spinner } from "@/components/tailgrids/core/spinner";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import type { Usuario } from "@/lib/api";
import { Envelope1, Eye, Locked3 } from "@tailgrids/icons";
import React, { useState } from "react";
import { toast } from "sonner";
import { EyeClose } from "../(with-layouts)/(forms)/form-elements/_components/icons";

interface DemoAccount {
  id: Usuario["rol"];
  name: string;
  email: string;
  roleTitle: string;
}

const DEMO_ACCOUNTS = {
  docente: {
    id: "docente",
    name: "Dr. Carlos Alcántara",
    email: "docente@unitru.edu.pe",
    roleTitle: "Docente Titular",
  },
  revisor: {
    id: "revisor",
    name: "Dr. Ricardo Guevara",
    email: "revisor@unitru.edu.pe",
    roleTitle: "Director de Escuela / Revisor",
  },
  admin: {
    id: "admin",
    name: "Ing. Roberto Mendoza",
    email: "admin@unitru.edu.pe",
    roleTitle: "Administrador Académico",
  },
} satisfies Record<Usuario["rol"], DemoAccount>;

export default function LoginPage() {
  const { loginWithCredentials, loginWithDemoAccount } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("docente@unitru.edu.pe");
  const [password, setPassword] = useState("unt2026");

  const [selectedDemoRole, setSelectedDemoRole] = useState<Usuario["rol"] | "">(
    "docente",
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelectChange = (roleKey: string) => {
    const account = Object.values(DEMO_ACCOUNTS).find(
      (account) => account.id === roleKey,
    );

    setSelectedDemoRole(account?.id ?? "");
    setErrorMessage(null);

    if (account) {
      const acc = account;
      setEmail(acc.email);
      setPassword("unt2026");
      toast.info(t("login.demoLoaded", { name: acc.name, email: acc.email }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage(t("login.errorEmptyEmail"));

      return;
    }

    if (!cleanEmail.endsWith("@unitru.edu.pe")) {
      setErrorMessage(t("login.errorDomain"));

      return;
    }

    if (!password.trim()) {
      setErrorMessage(t("login.errorEmptyPassword"));

      return;
    }

    setLoading(true);

    try {
      await loginWithCredentials(cleanEmail, password);
      toast.success(t("login.success"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("login.failed");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const targetRole = selectedDemoRole || "docente";
      await loginWithDemoAccount(targetRole);
      toast.success(t("login.success"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("login.failed");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background-gray-secondary_alt_2 text-text-primary">
      <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-8">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-6 sm:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-card-border bg-card-surface-area lg:min-h-152 lg:grid-cols-[1fr_1.1fr]">
          <LoginIntro />
          <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                {t("login.welcomeBack")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {t("login.welcomeSub")}
              </p>
            </div>
            {errorMessage && (
              <div className="mb-5" role="alert">
                <Alert status="error" className="w-full">
                  <AlertIndicator />
                  <AlertContent>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </AlertContent>
                </Alert>
              </div>
            )}
            <form
              onSubmit={handleFormSubmit}
              className="space-y-5"
              aria-busy={loading}
            >
              <div>
                <Label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  {t("login.emailLabel")}
                </Label>
                <InputGroup className="w-full">
                  <InputGroupAddon
                    align="inline-start"
                    className="text-icon-tertiary"
                  >
                    <Envelope1 className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                      setSelectedDemoRole("");
                    }}
                    placeholder={t("login.emailPlaceholder")}
                    className="min-h-12 text-base text-text-primary sm:text-sm"
                  />
                </InputGroup>
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  {t("login.passwordLabel")}
                </Label>
                <InputGroup className="w-full">
                  <InputGroupAddon
                    align="inline-start"
                    className="text-icon-tertiary"
                  >
                    <Locked3 className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="••••••••"
                    className="min-h-12 text-base text-text-primary sm:text-sm"
                  />
                  <InputGroupButton
                    type="button"
                    size="icon-sm"
                    className="mr-1 min-h-11 min-w-11 text-icon-tertiary hover:text-text-primary"
                    onPress={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? t("login.hidePassword")
                        : t("login.showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeClose className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </InputGroupButton>
                </InputGroup>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isDisabled={loading}
                className="min-h-12 w-full font-medium shadow-none transition-colors duration-150 motion-safe:active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span>{t("login.verifying")}</span>
                  </span>
                ) : (
                  t("login.submit")
                )}
              </Button>
              <button
                type="button"
                onClick={() => toast.info(t("login.forgotPasswordHint"))}
                className="block min-h-10 text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
              >
                {t("login.forgotPassword")}
              </button>
            </form>
            <details className="group mt-6 border-t border-card-border pt-5">
              <summary className="cursor-pointer rounded-sm text-sm font-medium text-text-secondary marker:text-icon-tertiary hover:text-text-primary">
                {t("login.demoNotice")}
              </summary>
              <div className="pt-4">
                <p className="mb-3 text-xs leading-5 text-text-tertiary">
                  {t("login.demoHint")}
                </p>
                <label htmlFor="demo-role-select" className="sr-only">
                  {t("login.demoLabel")}
                </label>
                <select
                  id="demo-role-select"
                  value={selectedDemoRole}
                  onChange={(e) => handleRoleSelectChange(e.target.value)}
                  className="min-h-11 w-full cursor-pointer rounded-lg border border-input-border bg-input-background px-3 py-2 text-base text-text-primary sm:text-sm"
                >
                  <option value="">{t("login.demoManual")}</option>
                  <option value="docente">{t("login.demoDocente")}</option>
                  <option value="revisor">{t("login.demoRevisor")}</option>
                  <option value="admin">{t("login.demoAdmin")}</option>
                </select>
                <Button
                  type="button"
                  appearance="outline"
                  isDisabled={loading}
                  onPress={handleDemoAccess}
                  className="mt-3 min-h-11 w-full"
                >
                  {t("login.googleSSO")}
                </Button>
              </div>
            </details>
          </div>
        </div>
      </div>
      <p className="px-4 pb-5 text-center text-xs leading-5 text-text-tertiary">
        {t("login.copyright")}
      </p>
    </div>
  );
}
