"use client";

import { useEffect } from "react";
import { formatMoney } from "@/lib/utils";
import { getCurrentPlayer, type GameState, type PlayerId } from "../engine";

/**
 * Atención del jugador (UX de juegos por turnos):
 *   1. Título de la pestaña: "🎲 ¡Tu turno!" — lo único visible si el usuario está en otra pestaña.
 *   2. Anuncio para lectores de pantalla: un texto DERIVADO del estado (sin useState ni efectos),
 *      que se muestra en una región aria-live; cada vez que cambia, se lee en voz alta.
 */
export function useTurnAttention(state: GameState, viewerId: PlayerId | null, sharedDevice = false): string {
  const current = getCurrentPlayer(state);
  const isMine = viewerId !== null && current?.id === viewerId;

  useEffect(() => {
    if (!isMine) return;
    const original = document.title;
    document.title = `🎲 ¡Tu turno! · ${original}`;
    // Cleanup: al terminar el turno (o desmontar) se restaura el título original.
    return () => {
      document.title = original;
    };
  }, [isMine]);

  return describeTurn(state, viewerId, sharedDevice);
}

function describeTurn(state: GameState, viewerId: PlayerId | null, sharedDevice: boolean): string {
  const name = (id: PlayerId) => (id === viewerId ? "Tú" : (state.players.find((p) => p.id === id)?.nickname ?? ""));
  const last = state.log.at(-1);
  const lastText =
    last?.kind === "captured" ? `${name(last.playerId)} capturó una moneda de ${formatMoney(last.value)}. ` : "";

  const current = getCurrentPlayer(state);
  if (!state.turn || !current) return lastText;

  const mine = sharedDevice || current.id === viewerId;
  const who = mine && viewerId !== null ? "Es tu turno" : `Turno de ${current.nickname}`;
  if (state.turn.phase === "roll") return `${lastText}${who}: ${mine ? "lanza el dado" : "va a lanzar el dado"}.`;
  return `${lastText}${who}. Salió ${state.turn.dice}; ${state.turn.movesLeft === 1 ? "queda 1 línea" : `quedan ${state.turn.movesLeft} líneas`}.`;
}
