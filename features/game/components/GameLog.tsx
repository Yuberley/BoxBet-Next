import { formatMoney } from "@/lib/utils";
import type { GameState, LogEntry } from "../engine";
import type { Seat } from "./Board";

function describe(entry: LogEntry) {
  switch (entry.kind) {
    case "joined":
      return "entró a la mesa.";
    case "rolled":
      return `sacó ${entry.value} en el dado${entry.auto ? " (automático)" : ""}.`;
    case "captured":
      return (
        <>
          capturó una moneda de <strong className="text-gold">{formatMoney(entry.value)}</strong>
        </>
      );
    case "timeout":
      return "se quedó sin tiempo: líneas al azar.";
    case "forfeit":
      return "abandonó la partida.";
  }
}

export function GameLog({ state, seatOf }: { state: GameState; seatOf: (id: string) => Seat }) {
  const names = new Map(state.players.map((p) => [p.id, p.nickname]));
  // Más reciente primero.
  const entries = [...state.log].reverse().slice(0, 8);

  return (
    <section className="rounded-card bg-surface p-5" aria-label="Historial de juego">
      <h2 className="mb-3 text-xs font-semibold tracking-widest text-muted">HISTORIAL DE JUEGO</h2>
      <ol className="space-y-2 text-sm" aria-live="polite">
        {entries.map((entry, i) => (
          <li key={`${entry.at}-${i}`} className="animate-fade-up text-slate-300">
            <strong className={seatOf(entry.playerId) === "p1" ? "text-p1" : "text-p2"}>
              {names.get(entry.playerId)}
            </strong>{" "}
            {describe(entry)}
          </li>
        ))}
      </ol>
    </section>
  );
}
