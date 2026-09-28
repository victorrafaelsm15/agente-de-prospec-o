"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">Algo deu errado</h1>
      <p className="mt-1.5 text-sm text-muted">
        {error.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <Button variant="secondary" size="sm" className="mt-5" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
