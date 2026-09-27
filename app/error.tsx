"use client"; // Los error boundaries deben ser Client Components.

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto my-16 max-w-md space-y-4 text-center">
      <h1 className="font-display text-2xl font-bold">Algo salió mal</h1>
      <p className="text-muted">{error.message || "Error inesperado."}</p>
      <Button onClick={reset}>Reintentar</Button>
    </Card>
  );
}
