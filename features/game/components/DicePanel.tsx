import { Dices, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Turn } from "../engine";
import type { Seat } from "./Board";
import { Dice } from "./Dice";

interface DicePanelProps {
  turn: Turn;
  /** Nombre y color de quien tiene el turno. */
  playerName: string;
  seat: Seat;
  /** ¿El turno es de quien mira? Si no, el panel informa en vez de ofrecer el botón. */
  isMine: boolean;
  canRoll: boolean;
  isRolling: boolean;
  onRoll: () => void;
}

export function DicePanel({ turn, playerName, seat, isMine, canRoll, isRolling, onRoll }: DicePanelProps) {
  const accent = seat === "p1" ? "text-p1" : "text-p2";

  let status;
  if (turn.phase === "roll") {
    status = isMine ? (
      <Button variant="turn" size="lg" className="flex-1" disabled={!canRoll || isRolling} onClick={onRoll}>
        <Dices className="size-5" aria-hidden />
        {isRolling ? "LANZANDO…" : "LANZAR"}
      </Button>
    ) : (
      <p className="flex flex-1 items-center gap-2 text-sm text-muted">
        <Hourglass className="size-4 animate-pulse" aria-hidden />
        Esperando a que <strong className={accent}>{playerName}</strong> lance…
      </p>
    );
  } else {
    status = (
      // La key reinicia la animación en cada lanzamiento; el retraso deja ver el dado caer antes del número.
      <p key={`text-${turn.number}-${turn.dice}`} className="flex-1 animate-fade-up text-sm text-slate-300 [animation-delay:0.9s]">
        {isMine ? "Salió" : `${playerName} sacó`} <strong className="text-white">{turn.dice}</strong>.{" "}
        {isMine ? "Quedan" : "Le quedan"}{" "}
        <strong className={cn("font-display text-2xl", accent)}>{turn.movesLeft}</strong>{" "}
        {turn.movesLeft === 1 ? "línea" : "líneas"}.
      </p>
    );
  }

  return (
    <section className="rounded-card bg-surface p-5" aria-label="Dado">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted">
          {isMine ? "TU DADO" : `DADO DE ${playerName.toUpperCase()}`}
        </h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">1d6</span>
      </header>
      {/* aria-live anuncia el resultado a lectores de pantalla sin mover el foco. */}
      <div className="flex items-center gap-4" aria-live="polite">
        {status}
        {/* La key cambia en cada lanzamiento → el dado se monta de nuevo y vuelve a girar. */}
        <Dice key={`dice-${turn.number}-${turn.dice}`} value={turn.dice} shaking={isRolling} size="3.75rem" />
      </div>
    </section>
  );
}
