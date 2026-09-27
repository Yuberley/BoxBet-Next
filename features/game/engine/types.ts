// Tipos del dominio. No dependen de React, Next ni Supabase:
// describen el juego, no la tecnología con la que se implementa.

export type PlayerId = string;

export type Orientation = "h" | "v";

/** Una arista (línea) del tablero. `h` = horizontal, `v` = vertical. */
export interface EdgeRef {
  orientation: Orientation;
  row: number;
  col: number;
}

/** Clave serializable de una arista, p. ej. "h:0:2". Permite usar un objeto como Set/Map. */
export type EdgeKey = `${Orientation}:${number}:${number}`;

export interface Player {
  id: PlayerId;
  nickname: string;
  avatarId: string;
}

export interface Cell {
  value: number;
  ownerId: PlayerId | null;
}

export type GameStatus = "waiting" | "playing" | "finished";

/** Fase del turno: primero se lanza el dado, luego se colocan tantas líneas como salió. */
export type TurnPhase = "roll" | "place";

export interface Turn {
  playerIndex: number;
  phase: TurnPhase;
  dice: number | null;
  movesLeft: number;
  /** Momento (epoch ms) en que vence la fase actual. El servidor lo usa para resolver timeouts. */
  deadline: number;
  number: number;
  /** Líneas trazadas en ESTE turno, en orden. */
  placed: EdgeKey[];
}

/** Resumen del turno anterior: permite a la UI resaltar "lo que acaba de pasar". */
export interface TurnSummary {
  playerId: PlayerId;
  edges: EdgeKey[];
}

export type LogEntry =
  | { kind: "joined"; playerId: PlayerId; at: number }
  | { kind: "rolled"; playerId: PlayerId; value: number; auto: boolean; at: number }
  | { kind: "captured"; playerId: PlayerId; value: number; at: number }
  | { kind: "timeout"; playerId: PlayerId; at: number }
  | { kind: "forfeit"; playerId: PlayerId; at: number };

export interface GameResult {
  /** `null` = empate. */
  winnerId: PlayerId | null;
  reason: "board-complete" | "forfeit";
}

/**
 * Estado completo de una partida. Es un documento JSON plano:
 * se puede guardar en la DB, enviar por red o usar en memoria sin cambios.
 */
export interface GameState {
  status: GameStatus;
  bet: number;
  gridSize: number;
  cells: Cell[][];
  players: Player[];
  /** Mapa arista → dueño. Un Record es O(1) para consultar y serializa a JSON directo. */
  edges: Partial<Record<EdgeKey, PlayerId>>;
  turn: Turn | null;
  lastTurn: TurnSummary | null;
  log: LogEntry[];
  result: GameResult | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  /** Código de la sala de revancha, si alguien la pidió. */
  rematchCode: string | null;
}

/** Fuente de aleatoriedad inyectable: en producción `Math.random`, en tests una semilla fija. */
export type Random = () => number;

/** Errores como valores (no excepciones): el llamador decide cómo mostrarlos. */
export type GameError =
  | "NOT_PLAYING"
  | "NOT_YOUR_TURN"
  | "ALREADY_ROLLED"
  | "MUST_ROLL_FIRST"
  | "EDGE_TAKEN"
  | "INVALID_EDGE"
  | "ROOM_FULL"
  | "ALREADY_JOINED"
  | "NOT_A_PLAYER";

export type GameResultOf<T = GameState> = { ok: true; state: T } | { ok: false; error: GameError };
