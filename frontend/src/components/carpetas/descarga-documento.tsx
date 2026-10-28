"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import { apiDescargarDocumento } from "@/lib/api";

interface DescargaDocumentoProps {
  documentoId: number;
  nombre: string;
}

export function DescargaDocumento({
  documentoId,
  nombre,
}: DescargaDocumentoProps) {
  const [descargando, setDescargando] = useState(false);

  const descargar = async () => {
    setDescargando(true);

    try {
      await apiDescargarDocumento(documentoId, nombre);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el documento.",
      );
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Button
              className="min-h-11"
      size="xs"
      variant="ghost"
      appearance="outline"
      isDisabled={descargando}
      onPress={descargar}
      aria-label={`Descargar ${nombre}`}
    >
      {descargando ? "Descargando…" : "Descargar"}
    </Button>
  );
}
