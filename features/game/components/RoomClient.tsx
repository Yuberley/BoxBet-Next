"use client";

import { useEffect, useEffectEvent, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  claimTimeoutAction,
  leaveRoomAction,
  placeEdgeAction,
  rematchAction,
  rollDiceAction,
} from "../actions";
import { getCurrentPlayer, toEdgeKey, type EdgeRef, type GameState } from "../engine";
import { useNow } from "../hooks/useNow";
import { useRoomChannel } from "../hooks/useRoomChannel";
import type { ActionResult, RoomSnapshot } from "../room";
import { GameTable } from "./GameTable";
import { JoinInvite } from "./JoinInvite";
import { ResultView } from "./ResultView";
import { WaitingRoom } from "./WaitingRoom";

interface RoomClientProps {
  initialRoom: RoomSnapshot;
  playerId: string | null;
  defaultNickname: string;
}

/**
 * Adaptador ONLINE de la mesa. Su trabajo es conectar tres fuentes:
 *   1. el estado inicial que renderizó el servidor (props)
 *   2. las respuestas de las Server Actions (lo que YO hice)
 *   3. los eventos Realtime (lo que hizo el RIVAL o el servidor)
 * Todas pasan por `accept`, que descarta versiones viejas (llegan en desorden por la red).
 */
export function RoomClient({ initialRoom, playerId, defaultNickname }: RoomClientProps) {
  const [room, setRoom] = useState(initialRoom);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Transición propia para el dado: "lanzando…" solo depende de ESTA acción, no de cualquier otra.
  const [rolling, startRolling] = useTransition();
  const { code, state } = room;

  const accept = (next: RoomSnapshot) => setRoom((current) => (next.version > current.version ? next : current));

  const onlineIds = useRoomChannel(code, playerId, { onUpdate: accept, onDelete: () => setClosed(true) });

  // UI optimista: la línea se pinta al instante; si el servidor la rechaza, React la revierte sola.
  // React REAPLICA las actualizaciones pendientes sobre cada estado nuevo del servidor, así que deben
  // ser idempotentes: si el servidor ya confirmó la línea, no la descontamos otra vez.
  const [optimisticState, addOptimisticEdge] = useOptimistic(state, (current: GameState, edge: EdgeRef) => {
    const key = toEdgeKey(edge);
    if (current.edges[key] || current.turn?.phase !== "place" || current.turn.movesLeft <= 0) return current;
    return {
      ...current,
      edges: { ...current.edges, [key]: playerId! },
      turn: { ...current.turn, movesLeft: current.turn.movesLeft - 1 },
    };
  });

  /** Ejecuta una Server Action dentro de una transición y aplica su resultado. */
  function run(action: () => Promise<ActionResult | void>, optimistic?: () => void, start = startTransition) {
    setError(null);
    start(async () => {
      optimistic?.();
      const result = await action();
      if (!result) return;
      // Tras un `await` React ya no sabe que seguimos en la transición: hay que volver a envolver
      // la actualización. Si no, el estado optimista se descarta antes de tiempo y la UI parpadea.
      start(() => {
        if (result.ok) accept(result.room);
        else setError(result.error);
      });
    });
  }

  // ─── Reloj: cuando vence el plazo, cualquiera en la sala le pide al servidor resolverlo ───
  const now = useNow();
  const claimed = useRef<number | null>(null);
  const deadline = state.turn?.deadline ?? null;
  const claimTimeout = useEffectEvent(() => {
    claimTimeoutAction(code).then((result) => result.ok && accept(result.room));
  });
  useEffect(() => {
    // 1 s de margen por diferencias de reloj entre navegador y servidor.
    if (deadline === null || now === null || now < deadline + 1000 || claimed.current === deadline) return;
    claimed.current = deadline; // una sola petición por plazo vencido
    claimTimeout();
  }, [now, deadline]);

  if (closed) {
    return (
      <Card className="mx-auto my-16 max-w-md space-y-4 text-center">
        <h1 className="font-display text-2xl font-bold">La sala se cerró</h1>
        <p className="text-muted">El anfitrión canceló la partida.</p>
        <Link href="/" className="font-semibold text-primary underline">Volver al inicio</Link>
      </Card>
    );
  }

  const isPlayer = state.players.some((p) => p.id === playerId);
  const toast = error && (
    <p role="alert" className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-sm animate-fade-up rounded-2xl bg-danger px-4 py-3 text-center font-semibold text-slate-950 shadow-xl">
      {error}
    </p>
  );

  if (state.status === "waiting") {
    if (!isPlayer) return <JoinInvite code={code} state={state} defaultNickname={defaultNickname} />;
    return <WaitingRoom code={code} state={state} leaving={pending} onLeave={() => run(() => leaveRoomAction(code))} />;
  }

  if (state.status === "finished") {
    const rematchPending = Boolean(state.rematchCode);
    return (
      <>
        <ResultView
          state={state}
          viewerId={playerId}
          isBusy={pending || !isPlayer}
          playAgainLabel={rematchPending ? "Aceptar revancha" : "Pedir revancha"}
          onPlayAgain={() => run(() => rematchAction(code))}
        />
        {toast}
      </>
    );
  }

  const isMyTurn = getCurrentPlayer(state)?.id === playerId;
  // Se puede seguir trazando mientras hay jugadas en vuelo (Next las envía en orden, una tras otra);
  // el límite lo pone el contador optimista.
  const hasMovesLeft = state.turn?.phase === "roll" || (optimisticState.turn?.movesLeft ?? 0) > 0;
  const offlineIds = new Set(state.players.filter((p) => !onlineIds.has(p.id)).map((p) => p.id));

  return (
    <>
      <GameTable
        state={optimisticState}
        viewerId={isPlayer ? playerId : null}
        canAct={isPlayer && isMyTurn && !rolling && hasMovesLeft}
        isRolling={rolling}
        offlineIds={offlineIds}
        onRoll={() => run(() => rollDiceAction(code), undefined, startRolling)}
        onPlaceEdge={(edge) => run(() => placeEdgeAction(code, edge), () => addOptimisticEdge(edge))}
        actions={
          isPlayer && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => confirm("¿Seguro? Si abandonas, tu rival gana la partida.") && run(() => leaveRoomAction(code))}
            >
              <Flag className="size-4" aria-hidden /> Abandonar partida
            </Button>
          )
        }
      />
      {!isPlayer && (
        <p className="pb-6 text-center text-sm text-muted">Estás viendo la partida como espectador.</p>
      )}
      {toast}
    </>
  );
}
