"use client";

import LanguageSwitcher from "@/components/common/header/language-switcher";
import ThemeToggle from "@/components/common/header/theme-toggle";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
} from "@/components/tailgrids/core/alert";
import { Button } from "@/components/tailgrids/core/button";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
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
import { Logo } from "@/utils/icon";
import { Envelope1, Eye, Google, Locked3 } from "@tailgrids/icons";
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
  const [selectedDemoRole, setSelectedDemoRole] = useState<Usuario["rol"] | "">("docente");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelectChange = (roleKey: string) => {
    const account = Object.values(DEMO_ACCOUNTS).find((account) => account.id === roleKey);
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

  const handleGoogleSSO = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const targetRole = selectedDemoRole || "docente";
      await loginWithDemoAccount(targetRole);
      toast.success("Autenticado con Google Workspace Institucional (@unitru.edu.pe)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al conectar con Google SSO.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background-gray-secondary_alt_2 p-3 sm:p-5 lg:p-6 text-text-primary transition-colors duration-200">
      {/* 50/50 Split Container with Compact Height & Zero Cutoff */}
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl sm:rounded-3xl border border-card-border bg-card-surface-area shadow-card-2 lg:grid-cols-2">
        {/* Left Side: Brand Visual & Single Representative Phrase */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#0B1727] p-6 sm:p-8 xl:p-10 text-white">
          {/* Subtle Geometric Background Contour Lines */}
          <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden opacity-15">
            <svg
              className="size-full"
              viewBox="0 0 500 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="120" cy="220" rx="320" ry="240" stroke="white" strokeWidth="1.5" />
              <ellipse cx="160" cy="230" rx="280" ry="210" stroke="white" strokeWidth="1.2" />
              <ellipse cx="200" cy="240" rx="240" ry="180" stroke="white" strokeWidth="1" />
              <ellipse cx="240" cy="250" rx="200" ry="150" stroke="white" strokeWidth="0.8" />
            </svg>
          </div>

          {/* Top Brand Mark */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <Logo className="size-9 drop-shadow-md sm:size-10" />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  UNT · 1824
                </span>
                <span className="text-[10px] text-white/75 sm:text-[11px]">{t("app.faculty")}</span>
              </div>
            </div>
          </div>

          {/* Center: Greeting & Single Representative Phrase */}
          <div className="relative z-10 my-6 sm:my-8 lg:my-auto">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl xl:text-4xl leading-snug">
              {t("login.heroTitle")}
            </h2>
            <p className="mt-2.5 text-xs font-normal leading-relaxed text-white/80 sm:text-sm max-w-[36ch]">
              {t("login.heroPhrase")}
            </p>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 border-t border-white/10 pt-3 text-[11px] text-white/50">
            <p>{t("login.copyright")}</p>
          </div>
        </div>

        {/* Right Side: Clean Form with Compact Spacing */}
        <div className="flex flex-col justify-between bg-card-surface-area p-6 sm:p-8 xl:p-10 text-text-primary">
          {/* Top Bar: Brand Title + Theme & Language Switchers */}
          <div className="flex items-center justify-between border-b border-card-border pb-2.5">
            <span className="text-xs font-bold tracking-tight text-text-primary sm:text-sm">
              {t("app.institution")}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* Form Section */}
          <div className="my-auto py-3">
            <div className="mb-3">
              <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                {t("login.welcomeBack")}
              </h1>
              <p className="mt-0.5 text-xs text-text-tertiary">{t("login.welcomeSub")}</p>
            </div>

            {/* Subtle Demo Role Selector */}
            <div className="mb-3">
              <label
                htmlFor="demo-role-select"
                className="mb-1 block text-[11px] font-medium text-text-tertiary"
              >
                {t("login.demoLabel")}
              </label>
              <select
                id="demo-role-select"
                value={selectedDemoRole}
                onChange={(e) => handleRoleSelectChange(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-input-background px-2.5 py-1 text-xs text-text-secondary outline-none transition focus:border-input-primary-focus-border focus:ring-2 focus:ring-input-primary-focus-border/20 cursor-pointer"
              >
                <option value="">{t("login.demoManual")}</option>
                <option value="docente">{t("login.demoDocente")}</option>
                <option value="revisor">{t("login.demoRevisor")}</option>
                <option value="admin">{t("login.demoAdmin")}</option>
              </select>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-3">
                <Alert status="error" className="w-full py-1.5">
                  <AlertIndicator />
                  <AlertContent>
                    <AlertDescription className="text-xs leading-normal">
                      {errorMessage}
                    </AlertDescription>
                  </AlertContent>
                </Alert>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              {/* Email */}
              <div>
                <Label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  {t("login.emailLabel")} <span className="text-red-500">*</span>
                </Label>
                <InputGroup className="w-full">
                  <InputGroupAddon align="inline-start" className="pl-3 pr-2 text-icon-tertiary">
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
                    className="py-1.5 text-xs sm:text-sm text-text-primary"
                  />
                </InputGroup>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    {t("login.passwordLabel")} <span className="text-red-500">*</span>
                  </Label>
                </div>
                <InputGroup className="w-full">
                  <InputGroupAddon align="inline-start" className="pl-3 pr-2 text-icon-tertiary">
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
                    className="py-1.5 text-xs sm:text-sm text-text-primary"
                  />
                  <InputGroupButton
                    size="icon-sm"
                    className="mr-2 text-icon-tertiary hover:text-text-primary"
                    onPress={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                  >
                    {showPassword ? <EyeClose className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroup>
              </div>

              {/* Keep session */}
              <div>
                <Checkbox
                  isSelected={rememberMe}
                  onChange={setRememberMe}
                  className="text-xs text-text-secondary cursor-pointer"
                >
                  {t("login.rememberMe")}
                </Checkbox>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                isDisabled={loading}
                className="w-full font-semibold shadow-xs transition active:scale-[0.99] cursor-pointer py-2 text-xs sm:text-sm"
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

              {/* Google Workspace SSO Button */}
              <Button
                type="button"
                appearance="outline"
                size="md"
                isDisabled={loading}
                onPress={handleGoogleSSO}
                className="w-full border-card-border text-xs font-medium text-text-secondary transition hover:bg-background-gray-primary hover:text-text-primary cursor-pointer py-1.5"
              >
                <Google className="size-4 text-[#4285F4]" />
                <span>{t("login.googleSSO")}</span>
              </Button>

              {/* Forgot password subtle link */}
              <div className="pt-0.5 text-center">
                <button
                  type="button"
                  onClick={() => toast.info(t("login.forgotPasswordHint"))}
                  className="text-xs text-text-tertiary transition hover:text-text-primary hover:underline cursor-pointer"
                >
                  {t("login.forgotPassword")}{" "}
                  <span className="font-semibold text-text-primary underline">
                    {t("login.clickHere")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
