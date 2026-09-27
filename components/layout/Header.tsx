import Link from "next/link";
import { Dices } from "lucide-react";
import { SoundToggle } from "@/components/sound/SoundToggle";

// Server Component: se renderiza en el servidor y no envía JS al navegador.
// Solo el botón de sonido (interactivo) es un Client Component.
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-canvas/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary">
            <Dices className="size-5" aria-hidden />
          </span>
          BoxBet
        </Link>
        <div className="flex items-center gap-0.5 text-sm whitespace-nowrap sm:gap-1">
          <Link href="/reglas" className="rounded-full px-2.5 py-2 text-slate-300 hover:bg-white/5 hover:text-white">
            Reglas
          </Link>
          <Link href="/local" className="rounded-full px-2.5 py-2 text-slate-300 hover:bg-white/5 hover:text-white">
            <span className="sm:hidden">Local</span>
            <span className="hidden sm:inline">Modo local</span>
          </Link>
          <SoundToggle />
        </div>
      </nav>
    </header>
  );
}
