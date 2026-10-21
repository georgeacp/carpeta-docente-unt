"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { Spinner } from "@/components/tailgrids/core/spinner";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomeDispatcherPage() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    if (!usuario) {
      router.replace("/login");

      return;
    }

    if (usuario.rol === "revisor") {
      router.replace("/revisor");
    } else if (usuario.rol === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/docente");
    }
  }, [usuario, cargando, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Badge color="primary" size="md">
          UNIVERSIDAD NACIONAL DE TRUJILLO
        </Badge>
        <div className="mt-2 flex items-center gap-2.5 text-text-primary">
          <Spinner size="md" />
          <span className="text-sm font-semibold tracking-wide">
            Cargando estación de trabajo de Carpeta Docente...
          </span>
        </div>
        <p className="max-w-md text-xs text-text-tertiary">
          Redirigiendo de forma segura a su panel institucional según su perfil asignado.
        </p>
      </div>
    </div>
  );
}
