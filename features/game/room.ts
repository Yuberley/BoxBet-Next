import type { GameError, GameState } from "./engine";

/** Lo que el cliente conoce de una sala: el estado + su versión (para descartar datos viejos). */
export interface RoomSnapshot {
  code: string;
  state: GameState;
  version: number;
}

export type ActionResult = { ok: true; room: RoomSnapshot } | { ok: false; error: string };

export type FormState = { error?: string } | undefined;

export const ROOM_CODE_PATTERN = /^\d{4}$/;

// Los errores del motor son códigos; la traducción a texto vive en la capa de presentación.
export const GAME_ERROR_MESSAGES: Record<GameError, string> = {
  NOT_PLAYING: "La partida no está en curso.",
  NOT_YOUR_TURN: "Espera tu turno.",
  ALREADY_ROLLED: "Ya lanzaste el dado.",
  MUST_ROLL_FIRST: "Primero lanza el dado.",
  EDGE_TAKEN: "Esa línea ya está ocupada.",
  INVALID_EDGE: "Línea inválida.",
  ROOM_FULL: "La sala está llena o la partida ya empezó.",
  ALREADY_JOINED: "Ya estás en esta sala.",
  NOT_A_PLAYER: "No eres jugador de esta sala.",
};
