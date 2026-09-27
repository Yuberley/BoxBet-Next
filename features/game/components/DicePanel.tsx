import { Dices } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Turn } from "../engine";
import { Dice } from "./Dice";

interface DicePanelProps {
  turn: Turn;
  canRoll: boolean;
  isRolling: boolean;
  onRoll: () => void;
}

export function DicePanel({ turn, canRoll, isRolling, onRoll }: DicePanelProps) {
  return (
    <section className="rounded-card bg-surface p-5" aria-label="Dado">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted">LANZAR DADO</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">1d6</span>
      </header>
      <div className="flex items-center gap-4">
        {turn.phase === "roll" ? (
          <Button variant="turn" size="lg" className="flex-1" disabled={!canRoll || isRolling} onClick={onRoll}>
            <Dices className="size-5" aria-hidden />
            {isRolling ? "LANZANDO…" : "LANZAR"}
          </Button>
        ) : (
          // aria-live anuncia el cambio a lectores de pantalla sin mover el foco.
          <p className="flex-1 text-sm text-slate-300" aria-live="polite">
            Salió <strong className="text-white">{turn.dice}</strong>. Quedan{" "}
            <strong className="font-display text-2xl text-p1">{turn.movesLeft}</strong>{" "}
            {turn.movesLeft === 1 ? "línea" : "líneas"}.
          </p>
        )}
        {/* La key cambia en cada lanzamiento → el dado se monta de nuevo y vuelve a girar. */}
        <Dice key={`${turn.number}-${turn.dice}`} value={turn.dice} size="3.75rem" />
      </div>
    </section>
  );
}
