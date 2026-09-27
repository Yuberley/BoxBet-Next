"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/components/sound/sound-preference";
import type { GameState, PlayerId } from "../engine";

/**
 * Los sonidos se DERIVAN comparando el estado anterior con el nuevo.
 * Así funcionan igual si el cambio vino de mí, del rival o de un timeout del servidor.
 */
export function useGameSounds(state: GameState, viewerId: PlayerId | null) {
  const play = useSound();
  const previous = useRef(state);

  useEffect(() => {
    const prev = previous.current;
    previous.current = state;
    if (prev === state) return;

    const owned = (s: GameState) => s.cells.flat().filter((c) => c.ownerId).length;

    if (prev.status !== "finished" && state.status === "finished") {
      const winnerId = state.result?.winnerId;
      play(viewerId && winnerId && winnerId !== viewerId ? "lose" : "win");
    } else if (prev.status === "waiting" && state.status === "playing") {
      play("start");
    } else if (
      viewerId &&
      state.turn?.phase === "roll" &&
      state.players[state.turn.playerIndex]?.id === viewerId &&
      prev.turn?.number !== state.turn.number
    ) {
      play("turn"); // "¡te toca!": aviso sonoro por si el jugador no está mirando
    } else if (owned(state) > owned(prev)) {
      play("capture");
    } else if (Object.keys(state.edges).length > Object.keys(prev.edges).length) {
      play("edge");
    } else if (state.turn?.dice && !prev.turn?.dice) {
      play("dice");
    }
  }, [state, viewerId, play]);
}
