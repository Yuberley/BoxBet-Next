import { getBoardTier } from "./constants";
import type { Cell, Random } from "./types";

/**
 * Tabla de factibilidad (programación dinámica):
 * `reachable[n]` = conjunto de sumas que se pueden formar con exactamente `n` monedas.
 * Con ella, al elegir cada moneda sabemos si todavía es posible llegar al total exacto.
 */
function buildReachable(cells: number, denominations: number[]): Set<number>[] {
  const reachable: Set<number>[] = [new Set([0])];
  for (let n = 1; n <= cells; n++) {
    const sums = new Set<number>();
    for (const prev of reachable[n - 1]) {
      for (const d of denominations) sums.add(prev + d);
    }
    reachable.push(sums);
  }
  return reachable;
}

/** Fisher–Yates: mezcla uniforme en O(n). */
export function shuffle<T>(items: T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Genera `count` monedas que suman EXACTAMENTE `total`.
 * Cada moneda se elige al azar, con más peso para las cercanas al promedio restante,
 * pero solo entre las que mantienen la suma alcanzable.
 */
export function distributeCoins(
  total: number,
  count: number,
  denominations: number[],
  random: Random,
): number[] {
  const reachable = buildReachable(count, denominations);
  if (!reachable[count].has(total)) {
    throw new Error(`No se puede formar ${total} con ${count} monedas de [${denominations}]`);
  }

  const values: number[] = [];
  let remaining = total;

  for (let left = count; left > 0; left--) {
    const average = remaining / left;
    const candidates = denominations.filter((d) => reachable[left - 1].has(remaining - d));
    // Peso inverso a la distancia al promedio: tablero variado pero equilibrado.
    const weights = candidates.map((d) => 1 / (1 + Math.abs(d - average) / average) ** 2);
    const pick = weightedPick(candidates, weights, random);
    values.push(pick);
    remaining -= pick;
  }

  return shuffle(values, random);
}

function weightedPick<T>(items: T[], weights: number[], random: Random): T {
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = random() * sum;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Crea la matriz de celdas para una apuesta. El pozo es la apuesta de ambos jugadores. */
export function createBoard(bet: number, random: Random): { gridSize: number; cells: Cell[][] } {
  const pot = bet * 2;
  const { gridSize, denominations } = getBoardTier(pot);
  const values = distributeCoins(pot, gridSize * gridSize, denominations, random);

  const cells = Array.from({ length: gridSize }, (_, row) =>
    Array.from({ length: gridSize }, (_, col) => ({
      value: values[row * gridSize + col],
      ownerId: null,
    })),
  );

  return { gridSize, cells };
}
