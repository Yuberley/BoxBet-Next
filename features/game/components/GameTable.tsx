"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Keyboard } from "lucide-react";
import { getCurrentPlayer, getScores, type EdgeKey, type EdgeRef, type GameState, type PlayerId } from "../engine";
import { useGameSounds } from "../hooks/useGameSounds";
import { useTurnAttention } from "../hooks/useTurnAttention";
import { Board, type Seat } from "./Board";
import { DicePanel } from "./DicePanel";
import { GameLog } from "./GameLog";
import { PlayerCard } from "./PlayerCard";
import { TurnTimer } from "./TurnTimer";

interface GameTableProps {
  state: GameState;
  /** Desde qué jugador se mira la mesa (null = modo local o espectador). */
  viewerId: PlayerId | null;
  /** Modo local: todos juegan desde este dispositivo (≠ espectador, que solo mira). */
  sharedDevice?: boolean;
  /** Título accesible de la vista (h1 oculto visualmente): p. ej. "Partida en la sala 1234". */
  title: string;
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
  sharedDevice = false,
  title,
  canAct,
  isRolling = false,
  showTimer = true,
  offlineIds,
  onRoll,
  onPlaceEdge,
  actions,
}: GameTableProps) {
  useGameSounds(state, viewerId);
  const announcement = useTurnAttention(state, viewerId, sharedDevice);

  const seatOf = (id: PlayerId): Seat => (state.players[0]?.id === id ? "p1" : "p2");
  const nameOf = (id: PlayerId) => state.players.find((p) => p.id === id)?.nickname ?? "";
  const scores = getScores(state);
  const current = getCurrentPlayer(state);
  const isMyTurn = sharedDevice || (viewerId !== null && current?.id === viewerId);

  // Gestión del foco: llevarlo siempre al SIGUIENTE paso, sin robarlo si el usuario está en otra parte.
  //   - Al lanzar, el botón LANZAR desaparece y el foco caería en <body>: lo movemos al tablero.
  //   - Al empezar mi turno con el foco en el tablero: lo movemos a LANZAR.
  const rootRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const phase = state.turn?.phase;
  const turnNumber = state.turn?.number;
  useEffect(() => {
    if (!isMyTurn) return;
    const active = document.activeElement;
    const lost = active === document.body || active === null;
    const inBoard = boardRef.current?.contains(active) ?? false;
    if (phase === "place" && lost) {
      boardRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    } else if (phase === "roll" && inBoard) {
      rootRef.current?.querySelector<HTMLButtonElement>('[aria-label="Dado"] button:not([disabled])')?.focus();
    }
  }, [phase, isMyTurn, turnNumber]);

  // "¿Qué acaba de pasar?": resaltamos lo que jugó el OTRO (lo propio ya lo vi al hacerlo).
  // En modo local (viewerId null) se resalta el turno anterior: ayuda al pasar el dispositivo.
  const recentKeys = new Set<EdgeKey>([
    ...(state.lastTurn && state.lastTurn.playerId !== viewerId ? state.lastTurn.edges : []),
    ...(viewerId && current && current.id !== viewerId ? (state.turn?.placed ?? []) : []),
  ]);

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
            turnLabel={sharedDevice || player.id === viewerId ? "TU TURNO" : "SU TURNO"}
        offline={offlineIds?.has(player.id)}
      />
    );
  };

  // En móvil los <aside> usan `display: contents`: sus hijos pasan a ser celdas del grid
  // y `order` los reacomoda (tablero → dado → jugadores). En escritorio vuelven a ser columnas.
  return (
    <div ref={rootRef} className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[20rem_1fr_20rem] lg:items-center lg:gap-8 lg:py-10">
      {/* Estructura semántica: cada vista tiene un h1, aunque visualmente no haga falta. */}
      <h1 className="sr-only">{title}</h1>
      {/* Región viva: el lector de pantalla lee cada cambio de este texto (turnos, capturas). */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {/* Regiones con nombre único: el lector de pantalla puede saltar entre ellas (landmarks). */}
      <aside aria-label={`Panel de ${left.nickname}`} className="contents lg:order-1 lg:block lg:space-y-4">
        <div className="order-3">{card(left)}</div>
        {state.turn && (
          <div className="order-2">
            <DicePanel
              turn={state.turn}
              playerName={current?.nickname ?? ""}
              seat={current ? seatOf(current.id) : "p1"}
              // En modo local (viewerId null) todos juegan desde este dispositivo.
              isMine={isMyTurn}
              sharedDevice={sharedDevice}
              canRoll={canAct}
              isRolling={isRolling}
              onRoll={onRoll}
            />
          </div>
        )}
        {actions && <div className="order-6">{actions}</div>}
      </aside>

      <div ref={boardRef} className="order-1 flex flex-col items-center gap-4 lg:order-2">
        <Board
          state={state}
          seatOf={seatOf}
          nameOf={nameOf}
          activeSeat={current ? seatOf(current.id) : null}
          interactive={canAct && state.turn?.phase === "place"}
          recentKeys={recentKeys}
          onPlaceEdge={onPlaceEdge}
        />
        {/* Ayuda contextual solo en los primeros turnos: enseña sin estorbar a quien ya sabe. */}
        {isMyTurn && state.turn?.phase === "place" && state.turn.number <= 2 && (
          <p className="flex items-center gap-2 text-center text-sm text-muted">
            <Keyboard className="size-4 shrink-0" aria-hidden />
            Toca una línea libre para trazarla · con teclado: flechas y Enter
          </p>
        )}
        {showTimer && state.turn && <TurnTimer deadline={state.turn.deadline} />}
      </div>

      <aside aria-label={`Panel de ${right?.nickname ?? "rival"} e historial`} className="contents lg:order-3 lg:block lg:space-y-4">
        <div className="order-4">{card(right)}</div>
        <div className="order-5">
          <GameLog state={state} seatOf={seatOf} />
        </div>
      </aside>
    </div>
  );
}
