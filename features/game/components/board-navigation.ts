import type { EdgeRef } from "../engine";

/*
 * Navegación con flechas (patrón "roving tabindex"): el tablero es UNA parada de Tab
 * y las flechas mueven el foco entre líneas.
 *
 * Cada línea tiene una posición en la cuadrícula (2N + 1):
 *   horizontal (fila r, col c) → (y = 2r,     x = 2c + 1)
 *   vertical   (fila r, col c) → (y = 2r + 1, x = 2c)
 * Reglas (simples = predecibles):
 *   ← →  recorren la misma fila de posiciones (salta de 2 en 2).
 *   ↑ ↓  pasan a la fila vecina en diagonal (horizontal ⇄ vertical), en zigzag.
 * Una primera versión "geométrica" (la más cercana en un cono de 45°) dejaba líneas
 * inalcanzables: lo detectó la prueba de alcanzabilidad en board-navigation.test.ts.
 */

export type Direction = "up" | "down" | "left" | "right";

export const KEY_TO_DIRECTION: Record<string, Direction | undefined> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const position = (e: EdgeRef) =>
  e.orientation === "h" ? { y: 2 * e.row, x: 2 * e.col + 1 } : { y: 2 * e.row + 1, x: 2 * e.col };

export function nextEdgeInDirection(from: EdgeRef, edges: EdgeRef[], direction: Direction): EdgeRef | null {
  const byPosition = new Map(edges.map((e) => [`${position(e).y},${position(e).x}`, e]));
  const at = (y: number, x: number) => byPosition.get(`${y},${x}`) ?? null;
  const { y, x } = position(from);

  if (direction === "left") return at(y, x - 2);
  if (direction === "right") return at(y, x + 2);

  const dy = direction === "down" ? 1 : -1;
  // Horizontal → prefiere la vertical de su izquierda; vertical → la horizontal de su derecha.
  // Si no existe (borde del tablero), prueba el otro lado y, por último, la misma columna.
  const preferred = from.orientation === "h" ? -1 : 1;
  return at(y + dy, x + preferred) ?? at(y + dy, x - preferred) ?? at(y + 2 * dy, x);
}
