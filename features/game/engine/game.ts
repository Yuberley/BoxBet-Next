import { adjacentCells, cellEdges, freeEdges, isValidEdge, toEdgeKey } from "./board";
import { createBoard } from "./coins";
import { DICE_FACES, LOG_LIMIT, MAX_PLAYERS, PLACE_SECONDS, ROLL_SECONDS } from "./constants";
import type {
  EdgeRef,
  GameResultOf,
  GameState,
  LogEntry,
  Player,
  PlayerId,
  Random,
} from "./types";

/*
 * Transiciones del juego como FUNCIONES PURAS: (estado, acción) → nuevo estado.
 * Nunca mutan la entrada; así el mismo código sirve en el servidor, en el modo local y en los tests.
 * `now` y `random` se reciben como parámetros para que el resultado sea predecible.
 */

const ok = (state: GameState): GameResultOf => ({ ok: true, state });
const fail = (error: Extract<GameResultOf, { ok: false }>["error"]): GameResultOf => ({
  ok: false,
  error,
});

export const rollDie = (random: Random) => Math.floor(random() * DICE_FACES) + 1;

// ─── Creación y unión ────────────────────────────────────────────────────────

export function createGame(input: {
  host: Player;
  bet: number;
  now: number;
  random: Random;
}): GameState {
  const { gridSize, cells } = createBoard(input.bet, input.random);
  return {
    status: "waiting",
    bet: input.bet,
    gridSize,
    cells,
    players: [input.host],
    edges: {},
    turn: null,
    log: [{ kind: "joined", playerId: input.host.id, at: input.now }],
    result: null,
    createdAt: input.now,
    startedAt: null,
    finishedAt: null,
    rematchCode: null,
  };
}

export function joinGame(state: GameState, player: Player, now: number): GameResultOf {
  if (state.players.some((p) => p.id === player.id)) return fail("ALREADY_JOINED");
  if (state.status !== "waiting" || state.players.length >= MAX_PLAYERS) return fail("ROOM_FULL");

  const next = structuredClone(state);
  next.players.push(player);
  pushLog(next, { kind: "joined", playerId: player.id, at: now });

  // Con la mesa completa, empieza el anfitrión.
  if (next.players.length === MAX_PLAYERS) {
    next.status = "playing";
    next.startedAt = now;
    startTurn(next, 0, now, 1);
  }
  return ok(next);
}

// ─── Acciones del turno ──────────────────────────────────────────────────────

export function rollDice(
  state: GameState,
  playerId: PlayerId,
  now: number,
  random: Random,
): GameResultOf {
  const guard = guardTurn(state, playerId);
  if (guard) return fail(guard);
  if (state.turn!.phase !== "roll") return fail("ALREADY_ROLLED");

  const next = structuredClone(state);
  applyRoll(next, rollDie(random), now, false);
  return ok(next);
}

export function placeEdge(
  state: GameState,
  playerId: PlayerId,
  edge: EdgeRef,
  now: number,
): GameResultOf {
  const guard = guardTurn(state, playerId);
  if (guard) return fail(guard);
  if (state.turn!.phase !== "place") return fail("MUST_ROLL_FIRST");
  if (!isValidEdge(edge, state.gridSize)) return fail("INVALID_EDGE");
  if (state.edges[toEdgeKey(edge)]) return fail("EDGE_TAKEN");

  const next = structuredClone(state);
  applyEdge(next, playerId, edge, now);
  return ok(next);
}

/** Abandonar: el rival gana por retiro. */
export function forfeit(state: GameState, playerId: PlayerId, now: number): GameResultOf {
  if (state.status !== "playing") return fail("NOT_PLAYING");
  if (!state.players.some((p) => p.id === playerId)) return fail("NOT_A_PLAYER");

  const next = structuredClone(state);
  pushLog(next, { kind: "forfeit", playerId, at: now });
  const winner = next.players.find((p) => p.id !== playerId)!;
  finish(next, { winnerId: winner.id, reason: "forfeit" }, now);
  return ok(next);
}

/**
 * Evaluación perezosa del reloj: no hay un proceso contando segundos.
 * Cuando alguien llama esto, se resuelven todas las fases vencidas hasta `now`.
 * - Fase "roll" vencida  → se lanza el dado automáticamente.
 * - Fase "place" vencida → se colocan al azar las líneas restantes.
 */
export function resolveTimeouts(state: GameState, now: number, random: Random): GameState {
  if (state.status !== "playing" || !state.turn || state.turn.deadline > now) return state;

  const next = structuredClone(state);
  // Límite de seguridad: evita un bucle infinito si algo sale mal.
  for (let i = 0; i < 500 && next.status === "playing" && next.turn!.deadline <= now; i++) {
    const turn = next.turn!;
    const expiredAt = turn.deadline;
    const playerId = next.players[turn.playerIndex].id;

    if (turn.phase === "roll") {
      applyRoll(next, rollDie(random), expiredAt, true);
    } else {
      pushLog(next, { kind: "timeout", playerId, at: expiredAt });
      while (next.status === "playing" && next.turn!.playerIndex === turn.playerIndex) {
        const options = freeEdges(next);
        applyEdge(next, playerId, options[Math.floor(random() * options.length)], expiredAt);
      }
    }
  }
  return next;
}

export function setRematch(state: GameState, code: string): GameState {
  return { ...state, rematchCode: code };
}

// ─── Selectores (estado derivado: se calcula, no se guarda) ─────────────────

export function getScores(state: GameState) {
  return state.players.map((player) => {
    const owned = state.cells.flat().filter((cell) => cell.ownerId === player.id);
    return {
      playerId: player.id,
      money: owned.reduce((sum, cell) => sum + cell.value, 0),
      coins: owned.length,
    };
  });
}

export function getCurrentPlayer(state: GameState): Player | null {
  return state.turn ? (state.players[state.turn.playerIndex] ?? null) : null;
}

export const getPot = (state: GameState) => state.bet * 2;

// ─── Helpers internos (trabajan sobre la copia `next`) ──────────────────────

function guardTurn(state: GameState, playerId: PlayerId) {
  if (state.status !== "playing" || !state.turn) return "NOT_PLAYING" as const;
  if (state.players[state.turn.playerIndex]?.id !== playerId) return "NOT_YOUR_TURN" as const;
  return null;
}

function startTurn(next: GameState, playerIndex: number, at: number, number: number) {
  next.turn = {
    playerIndex,
    phase: "roll",
    dice: null,
    movesLeft: 0,
    deadline: at + ROLL_SECONDS * 1000,
    number,
  };
}

function applyRoll(next: GameState, value: number, at: number, auto: boolean) {
  const turn = next.turn!;
  turn.phase = "place";
  turn.dice = value;
  // Si quedan menos líneas libres que el valor del dado, solo se juegan las que hay.
  turn.movesLeft = Math.min(value, freeEdges(next).length);
  turn.deadline = at + PLACE_SECONDS * 1000;
  pushLog(next, { kind: "rolled", playerId: next.players[turn.playerIndex].id, value, auto, at });
}

function applyEdge(next: GameState, playerId: PlayerId, edge: EdgeRef, at: number) {
  next.edges[toEdgeKey(edge)] = playerId;

  // Solo las celdas vecinas pueden haberse cerrado con esta línea.
  for (const { row, col } of adjacentCells(edge, next.gridSize)) {
    const cell = next.cells[row][col];
    if (!cell.ownerId && cellEdges(row, col).every((key) => next.edges[key])) {
      cell.ownerId = playerId;
      pushLog(next, { kind: "captured", playerId, value: cell.value, at });
    }
  }

  if (next.cells.flat().every((cell) => cell.ownerId)) {
    const [a, b] = getScores(next);
    const winnerId = a.money === b.money ? null : a.money > b.money ? a.playerId : b.playerId;
    finish(next, { winnerId, reason: "board-complete" }, at);
    return;
  }

  const turn = next.turn!;
  turn.movesLeft -= 1;
  if (turn.movesLeft <= 0) {
    startTurn(next, (turn.playerIndex + 1) % next.players.length, at, turn.number + 1);
  }
}

function finish(next: GameState, result: NonNullable<GameState["result"]>, at: number) {
  next.status = "finished";
  next.result = result;
  next.finishedAt = at;
  next.turn = null;
}

function pushLog(next: GameState, entry: LogEntry) {
  next.log = [...next.log, entry].slice(-LOG_LIMIT);
}
