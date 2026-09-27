import Link from "next/link";
import { Crown, Home, Hourglass, PiggyBank, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, formatDuration, formatMoney } from "@/lib/utils";
import { getPot, getScores, type GameState, type PlayerId } from "../engine";
import { Avatar } from "./Avatar";

interface ResultViewProps {
  state: GameState;
  viewerId: PlayerId | null;
  onPlayAgain: () => void;
  playAgainLabel?: string;
  /** Mensaje destacado sobre los botones (p. ej. "Profe quiere la revancha"). */
  notice?: string;
  isBusy?: boolean;
}

export function ResultView({ state, viewerId, onPlayAgain, playAgainLabel = "Jugar de nuevo", notice, isBusy }: ResultViewProps) {
  const scores = getScores(state);
  const winnerId = state.result?.winnerId ?? null;
  const winner = state.players.find((p) => p.id === winnerId);
  const winnerScore = scores.find((s) => s.playerId === winnerId);
  const scoreOf = (id: PlayerId) => scores.find((s) => s.playerId === id)!;
  const standings = [...state.players].sort((a, b) => scoreOf(b.id).money - scoreOf(a.id).money);

  const title = !winner
    ? ["¡Empate", "técnico!"]
    : viewerId && viewerId !== winnerId
      ? ["Buena", "partida"]
      : ["¡Victoria", "absoluta!"];

  const stats = [
    { icon: PiggyBank, label: "Pozo en juego", value: formatMoney(getPot(state)) },
    { icon: Hourglass, label: "Duración", value: formatDuration((state.finishedAt ?? 0) - (state.startedAt ?? 0)) },
    { icon: RotateCcw, label: "Líneas trazadas", value: String(Object.keys(state.edges).length) },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 text-center">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold text-accent">
          <Trophy className="size-4" aria-hidden /> PARTIDA FINALIZADA
        </span>
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
          {title[0]} <span className="bg-linear-to-r from-accent to-p1 bg-clip-text text-transparent">{title[1]}</span>
        </h1>
        <p className="text-muted">
          {state.result?.reason === "forfeit" ? "Tu rival abandonó la mesa." : "La mesa ha hablado. Estos son los resultados."}
        </p>
      </header>

      {winner && (
        <Card className="mx-auto max-w-md shadow-primary/20">
          <div className="relative mx-auto w-fit">
            <Avatar avatarId={winner.avatarId} size="lg" className="ring-4 ring-accent" />
            <Crown className="absolute -top-3 -right-3 size-9 rounded-full bg-gold p-1.5 text-slate-900" aria-hidden />
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold">{winner.nickname}</h2>
          <p className="font-semibold tracking-wide text-accent">GANADOR DE LA PARTIDA</p>
          <hr className="my-5 border-white/10" />
          <p className="text-sm text-muted">GANANCIA</p>
          <p className="font-display text-4xl font-extrabold">{formatMoney(winnerScore?.money ?? 0)}</p>
        </Card>
      )}

      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-card bg-surface p-5 text-left">
            <dt className="flex items-center gap-2 text-sm text-muted">
              <Icon className="size-4" aria-hidden /> {label}
            </dt>
            <dd className="mt-1 font-display text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      {notice && (
        <p role="status" className="mx-auto w-fit animate-fade-up rounded-full border border-gold/40 bg-gold/10 px-5 py-2 font-semibold text-gold">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-14 items-center gap-2 rounded-full px-8 font-display font-bold text-slate-200 hover:bg-white/5"
        >
          <Home className="size-5" aria-hidden /> Menú
        </Link>
        <Button size="lg" onClick={onPlayAgain} disabled={isBusy}>
          <RotateCcw className="size-5" aria-hidden /> {playAgainLabel}
        </Button>
      </div>

      <section className="overflow-hidden rounded-card border border-white/5 bg-surface text-left">
        <h2 className="border-b border-white/5 px-6 py-4 font-display text-lg font-bold">Tabla de posiciones</h2>
        <ol>
          {standings.map((player) => {
            // Ranking de competencia: con el mismo puntaje se comparte el puesto (1, 1).
            const rank = standings.findIndex((p) => scoreOf(p.id).money === scoreOf(player.id).money) + 1;
            return (
              <li key={player.id} className="flex items-center gap-4 border-b border-white/5 px-6 py-4 last:border-0">
                <span className={cn("grid size-8 place-items-center rounded-full text-sm font-bold", rank === 1 && winner ? "bg-gold text-slate-900" : "bg-white/10")}>
                  {rank}
                </span>
                <Avatar avatarId={player.avatarId} size="sm" />
                <span className="flex-1 font-semibold">
                  {player.nickname}
                  {player.id === viewerId && <span className="ml-2 text-xs text-muted">(tú)</span>}
                </span>
                <span className="text-right">
                  <span className="block font-display font-bold">{formatMoney(scoreOf(player.id).money)}</span>
                  <span className="text-xs text-muted">
                    {scoreOf(player.id).coins} {scoreOf(player.id).coins === 1 ? "moneda" : "monedas"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
