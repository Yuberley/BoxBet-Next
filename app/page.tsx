import Link from "next/link";
import { cookies } from "next/headers";
import { CircleHelp, Gamepad2, Users } from "lucide-react";
import { LobbyForm } from "@/features/game/components/LobbyForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Server Component: lee la cookie del apodo en el servidor y la pasa como prop al formulario.
export default async function HomePage() {
  const nickname = (await cookies()).get("boxbet_nickname")?.value ?? "";

  return (
    <div className="flex flex-1 flex-col gap-12 py-12 sm:py-16">
      <header className="mx-auto max-w-4xl space-y-5 px-4 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-surface shadow-lg shadow-primary/10">
          <Gamepad2 className="size-8 text-primary" aria-hidden />
        </span>
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-balance sm:text-7xl">
          Bienvenido a la Arena
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-balance text-muted">
          El clásico de monedas, ahora digital. Crea una sala para desafiar a un amigo o únete con un código existente.
        </p>
      </header>

      {isSupabaseConfigured ? (
        <LobbyForm defaultNickname={nickname} />
      ) : (
        <p className="mx-auto max-w-md rounded-2xl border border-gold/30 bg-gold/10 p-4 text-center text-sm">
          El modo en línea necesita las variables de Supabase en <code>.env.local</code>. Mientras tanto, prueba el{" "}
          <Link href="/local" className="font-semibold underline">modo local</Link>.
        </p>
      )}

      <footer className="flex justify-center gap-6 text-sm text-muted">
        <Link href="/reglas" className="flex items-center gap-1.5 hover:text-white">
          <CircleHelp className="size-4" aria-hidden /> ¿Cómo jugar?
        </Link>
        <Link href="/local" className="flex items-center gap-1.5 hover:text-white">
          <Users className="size-4" aria-hidden /> Jugar en este dispositivo
        </Link>
      </footer>
    </div>
  );
}
