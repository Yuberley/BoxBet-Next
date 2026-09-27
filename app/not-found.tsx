import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <Card className="mx-auto my-16 max-w-md space-y-4 text-center">
      <p className="font-display text-6xl font-extrabold text-primary">404</p>
      <h1 className="font-display text-2xl font-bold">Esta mesa no existe</h1>
      <p className="text-muted">Revisa el código o crea una sala nueva.</p>
      <Link href="/" className="inline-block font-semibold text-primary underline">
        Volver al inicio
      </Link>
    </Card>
  );
}
