"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/tailgrids/core/button";
import { Dialog, DialogTitle } from "@/components/tailgrids/core/dialog";

interface NavigationGuard {
  navigate: (action: () => void) => void;
  register: (blocked: boolean, discard: () => void, busy?: boolean) => void;
}

const GuardContext = createContext<NavigationGuard | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const blocked = useRef(false);
  const discard = useRef<() => void>(() => {});
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const register = useCallback((value: boolean, reset: () => void, saving = false) => {
    blocked.current = value;
    discard.current = reset;
    setDirty(value);
    setBusy(saving);
  }, []);

  const navigate = useCallback((action: () => void) => {
    if (blocked.current) setPending(() => action);
    else action();
  }, []);

  useEffect(() => {
    if (!dirty) return;

    const currentUrl = window.location.href;
    const currentState = window.history.state;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!blocked.current) return;

      event.preventDefault();
      event.returnValue = "";
    };

    // Restore this document before Next handles browser Back, then ask explicitly.
    const popState = (event: PopStateEvent) => {
      if (!blocked.current || window.location.href === currentUrl) return;

      const destination = window.location.href;
      event.stopImmediatePropagation();
      window.history.pushState(currentState, "", currentUrl);
      navigate(() => router.push(destination));
    };

    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", popState, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", popState, true);
    };
  }, [dirty, navigate, router]);

  const value = useMemo(() => ({ navigate, register }), [navigate, register]);

  return <GuardContext.Provider value={value}>
    {children}
    <Dialog isOpen={pending !== null} onOpenChange={open => { if (!open) setPending(null); }} showCloseButton={false}>
      <DialogTitle>Comentarios sin guardar</DialogTitle>
      <p className="my-5 text-sm text-text-secondary">{busy ? "Espera a que termine el guardado antes de salir." : "Hay comentarios modificados que aún no se han guardado. Puedes permanecer o descartarlos para continuar."}</p>
      <div className="flex flex-wrap justify-end gap-3">
        <Button appearance="outline" autoFocus onPress={() => setPending(null)}>Permanecer</Button>
        <Button variant="danger" isDisabled={busy} onPress={() => {
          const action = pending;
          blocked.current = false;
          discard.current();
          setDirty(false);
          setPending(null);
          action?.();
        }}>Descartar y continuar</Button>
      </div>
    </Dialog>
  </GuardContext.Provider>;
}

export function useNavigationGuard() {
  const context = useContext(GuardContext);

  if (!context) throw new Error("NavigationGuardProvider no está disponible.");

  return context;
}
