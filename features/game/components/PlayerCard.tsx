import { cn, formatMoney } from "@/lib/utils";
import type { Player } from "../engine";
import { Avatar } from "./Avatar";
import type { Seat } from "./Board";
import { CoinIcon } from "./Coin";

interface PlayerCardProps {
  player: Player;
  seat: Seat;
  money: number;
  coins: number;
  isTurn: boolean;
  isViewer: boolean;
  turnLabel: string;
  offline?: boolean;
}

export function PlayerCard({ player, seat, money, coins, isTurn, isViewer, turnLabel, offline }: PlayerCardProps) {
  const accent = seat === "p1" ? "border-p1 shadow-p1/25" : "border-p2 shadow-p2/25";
  const badge = seat === "p1" ? "bg-p1" : "bg-p2";

  return (
    <article
      className={cn(
        "relative rounded-card border-2 bg-surface p-5 transition",
        isTurn ? cn(accent, "shadow-2xl") : "border-transparent",
      )}
      aria-current={isTurn ? "true" : undefined}
    >
      {isTurn && (
        <span className={cn("absolute -top-px right-6 rounded-b-lg px-3 py-0.5 text-xs font-bold tracking-wider text-slate-950", badge)}>
          {turnLabel}
        </span>
      )}
      <header className="mb-4 flex items-center gap-4">
        <Avatar avatarId={player.avatarId} size="md" />
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-bold">
            {player.nickname}
            {isViewer && <span className="ml-2 text-xs font-medium text-muted">(tú)</span>}
          </h2>
          <p className={cn("text-sm", isTurn ? (seat === "p1" ? "text-p1" : "text-p2") : "text-muted")}>
            {offline ? "Desconectado" : isTurn ? "Jugando…" : "Esperando…"}
          </p>
        </div>
      </header>
      <dl className="space-y-2">
        <div className="flex items-center justify-between rounded-full bg-canvas-deep/70 px-5 py-3">
          <dt className="text-sm text-muted">Puntaje total</dt>
          <dd className="font-display text-2xl font-bold tabular-nums">{formatMoney(money, false)}</dd>
        </div>
        <div className="flex items-center justify-between rounded-full bg-canvas-deep/70 px-5 py-3">
          <dt className="text-sm text-muted">Monedas</dt>
          <dd className="flex items-center gap-1.5 font-display text-lg font-bold">
            <CoinIcon /> {coins}
          </dd>
        </div>
      </dl>
    </article>
  );
}
