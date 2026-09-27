import { describe, expect, it } from "vitest";
import {
  BET_OPTIONS,
  PLACE_SECONDS,
  ROLL_SECONDS,
  allEdges,
  cellEdges,
  createBoard,
  createGame,
  distributeCoins,
  forfeit,
  fromEdgeKey,
  getBoardTier,
  getScores,
  joinGame,
  placeEdge,
  resolveTimeouts,
  rollDice,
  seededRandom,
  type GameResultOf,
  type GameState,
} from ".";

const seeded = seededRandom;

const unwrap = (result: GameResultOf): GameState => {
  if (!result.ok) throw new Error(result.error);
  return result.state;
};

const alice = { id: "alice", nickname: "Alice", avatarId: "fire" };
const bob = { id: "bob", nickname: "Bob", avatarId: "star" };

function startedGame(bet = 100, seed = 1) {
  const random = seeded(seed);
  const game = createGame({ host: alice, bet, now: 0, random });
  return { state: unwrap(joinGame(game, bob, 0)), random };
}

describe("monedas", () => {
  it.each(BET_OPTIONS)("el tablero de una apuesta de %i suma exactamente el pozo", (bet) => {
    for (let seed = 0; seed < 20; seed++) {
      const { cells, gridSize } = createBoard(bet, seeded(seed));
      const values = cells.flat().map((c) => c.value);
      expect(values).toHaveLength(gridSize * gridSize);
      expect(values.reduce((a, b) => a + b, 0)).toBe(bet * 2);
      expect(values.every((v) => getBoardTier(bet * 2).denominations.includes(v))).toBe(true);
    }
  });

  it("falla con un mensaje claro si el total es imposible", () => {
    expect(() => distributeCoins(15, 1, [10, 20], Math.random)).toThrow(/No se puede formar/);
  });
});

describe("turnos", () => {
  it("el juego empieza cuando entra el segundo jugador", () => {
    const { state } = startedGame();
    expect(state.status).toBe("playing");
    expect(state.turn).toMatchObject({ playerIndex: 0, phase: "roll" });
  });

  it("no deja jugar fuera de turno ni colocar antes de lanzar", () => {
    const { state, random } = startedGame();
    expect(rollDice(state, "bob", 0, random)).toEqual({ ok: false, error: "NOT_YOUR_TURN" });
    expect(placeEdge(state, "alice", { orientation: "h", row: 0, col: 0 }, 0)).toEqual({
      ok: false,
      error: "MUST_ROLL_FIRST",
    });
  });

  it("tras colocar tantas líneas como el dado, pasa el turno", () => {
    const { state: start, random } = startedGame();
    let state = unwrap(rollDice(start, "alice", 0, random));
    const moves = state.turn!.dice!;
    const edges = allEdges(state.gridSize).slice(0, moves);
    for (const edge of edges) state = unwrap(placeEdge(state, "alice", edge, 0));
    expect(state.turn).toMatchObject({ playerIndex: 1, phase: "roll", number: 2 });
  });

  it("no permite repetir una línea", () => {
    const { state: start } = startedGame();
    // Dado fijo en 6 para tener movimientos de sobra.
    let state = unwrap(rollDice(start, "alice", 0, () => 0.99));
    const edge = { orientation: "h" as const, row: 0, col: 0 };
    state = unwrap(placeEdge(state, "alice", edge, 0));
    expect(placeEdge(state, "alice", edge, 0)).toEqual({ ok: false, error: "EDGE_TAKEN" });
  });

  it("no modifica el estado original (inmutabilidad)", () => {
    const { state, random } = startedGame();
    const snapshot = structuredClone(state);
    rollDice(state, "alice", 0, random);
    expect(state).toEqual(snapshot);
  });
});

describe("capturas", () => {
  it("cerrar los 4 lados de una celda la captura", () => {
    const { state: start } = startedGame();
    let state = unwrap(rollDice(start, "alice", 0, () => 0.99)); // 6 movimientos
    for (const key of cellEdges(0, 0)) state = unwrap(placeEdge(state, "alice", fromEdgeKey(key), 0));
    expect(state.cells[0][0].ownerId).toBe("alice");
    expect(getScores(state)[0].money).toBe(state.cells[0][0].value);
  });
});

describe("tiempo (evaluación perezosa)", () => {
  it("no hace nada si el plazo no ha vencido", () => {
    const { state, random } = startedGame();
    expect(resolveTimeouts(state, 1000, random)).toBe(state);
  });

  it("lanza el dado y juega al azar cuando vencen ambas fases", () => {
    const { state, random } = startedGame();
    const later = (ROLL_SECONDS + PLACE_SECONDS) * 1000;
    const next = resolveTimeouts(state, later, random);
    expect(next.turn).toMatchObject({ playerIndex: 1, phase: "roll" });
    expect(Object.keys(next.edges).length).toBeGreaterThan(0);
  });

  it("una partida abandonada termina sola", () => {
    const { state, random } = startedGame(2000);
    const next = resolveTimeouts(state, 10 ** 9, random);
    expect(next.status).toBe("finished");
    const pot = getScores(next).reduce((sum, s) => sum + s.money, 0);
    expect(pot).toBe(4000);
  });
});

describe("fin de partida", () => {
  it("retirarse le da la victoria al rival", () => {
    const { state } = startedGame();
    const next = unwrap(forfeit(state, "alice", 0));
    expect(next.result).toEqual({ winnerId: "bob", reason: "forfeit" });
  });
});
