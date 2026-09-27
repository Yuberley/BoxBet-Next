"use client";

import type { ReactNode } from "react";
import { getCurrentPlayer, getScores, type EdgeRef, type GameState, type PlayerId } from "../engine";
import { useGameSounds } from "../hooks/useGameSounds";
import { Board, type Seat } from "./Board";
import { DicePanel } from "./DicePanel";
import { GameLog } from "./GameLog";
import { PlayerCard } from "./PlayerCard";
import { TurnTimer } from "./TurnTimer";

interface GameTableProps {
  state: GameState;
  /** Desde qué jugador se mira la mesa (null = modo local o espectador). */
  viewerId: PlayerId | null;
  /** ¿Quien mira puede actuar ahora? Lo decide el adaptador (local u online). */
  canAct: boolean;
  isRolling?: boolean;
  showTimer?: boolean;
  offlineIds?: ReadonlySet<PlayerId>;
  onRoll: () => void;
  onPlaceEdge: (edge: EdgeRef) => void;
  actions?: ReactNode;
}

/**
 * Mesa de juego PRESENTACIONAL: recibe estado y callbacks, no sabe de red ni de base de datos.
 * La reutilizan el modo local y el modo online.
 */
export function GameTable({
  state,
  viewerId,
  canAct,
  isRolling = false,
  showTimer = true,
  offlineIds,
  onRoll,
  onPlaceEdge,
  actions,
}: GameTableProps) {
  useGameSounds(state, viewerId);

  const seatOf = (id: PlayerId): Seat => (state.players[0]?.id === id ? "p1" : "p2");
  const scores = getScores(state);
  const current = getCurrentPlayer(state);

  // El jugador que mira va a la izquierda (como en el mockup).
  const [left, right] =
    viewerId && state.players[1]?.id === viewerId ? [state.players[1], state.players[0]] : state.players;

  const card = (player: typeof left) => {
    const score = scores.find((s) => s.playerId === player.id)!;
    return (
      <PlayerCard
        player={player}
        seat={seatOf(player.id)}
        money={score.money}
        coins={score.coins}
        isTurn={current?.id === player.id}
        isViewer={player.id === viewerId}
        // En modo local todos juegan desde el mismo dispositivo: siempre es "tu" turno.
        turnLabel={viewerId === null || player.id === viewerId ? "TU TURNO" : "SU TURNO"}
        offline={offlineIds?.has(player.id)}
      />
    );
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[20rem_1fr_20rem] lg:items-center lg:gap-8 lg:py-10">
      <aside className="order-2 space-y-4 lg:order-1">
        {card(left)}
        {state.turn && (
          <DicePanel turn={state.turn} canRoll={canAct} isRolling={isRolling} onRoll={onRoll} />
        )}
        {actions}
      </aside>

      <div className="order-1 flex flex-col items-center gap-4 lg:order-2">
        <Board
          state={state}
          seatOf={seatOf}
          activeSeat={current ? seatOf(current.id) : null}
          interactive={canAct && state.turn?.phase === "place"}
          onPlaceEdge={onPlaceEdge}
        />
        {showTimer && state.turn && <TurnTimer deadline={state.turn.deadline} />}
      </div>

      <aside className="order-3 space-y-4">
        {card(right)}
        <GameLog state={state} seatOf={seatOf} />
      </aside>
    </div>
  );
}
