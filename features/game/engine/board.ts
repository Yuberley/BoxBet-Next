import type { EdgeKey, EdgeRef, GameState } from "./types";

/*
 * Geometría del tablero (N = gridSize celdas por lado):
 *   - Horizontales: (N + 1) filas × N columnas   → "h:fila:col"
 *   - Verticales:   N filas × (N + 1) columnas   → "v:fila:col"
 * La celda (r, c) está rodeada por: h:r:c (arriba), h:r+1:c (abajo),
 * v:r:c (izquierda) y v:r:c+1 (derecha).
 */

export const toEdgeKey = ({ orientation, row, col }: EdgeRef): EdgeKey =>
  `${orientation}:${row}:${col}`;

export function fromEdgeKey(key: EdgeKey): EdgeRef {
  const [orientation, row, col] = key.split(":");
  return { orientation: orientation as EdgeRef["orientation"], row: Number(row), col: Number(col) };
}

export function isValidEdge({ orientation, row, col }: EdgeRef, gridSize: number): boolean {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) return false;
  return orientation === "h"
    ? row <= gridSize && col < gridSize
    : orientation === "v"
      ? row < gridSize && col <= gridSize
      : false;
}

export function allEdges(gridSize: number): EdgeRef[] {
  const edges: EdgeRef[] = [];
  for (let row = 0; row <= gridSize; row++) {
    for (let col = 0; col < gridSize; col++) edges.push({ orientation: "h", row, col });
  }
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col <= gridSize; col++) edges.push({ orientation: "v", row, col });
  }
  return edges;
}

export function freeEdges(state: Pick<GameState, "gridSize" | "edges">): EdgeRef[] {
  return allEdges(state.gridSize).filter((edge) => !state.edges[toEdgeKey(edge)]);
}

export function cellEdges(row: number, col: number): EdgeKey[] {
  return [`h:${row}:${col}`, `h:${row + 1}:${col}`, `v:${row}:${col}`, `v:${row}:${col + 1}`];
}

/** Celdas vecinas a una arista: solo ellas pueden cerrarse al colocarla (máx. 2). */
export function adjacentCells({ orientation, row, col }: EdgeRef, gridSize: number) {
  const candidates =
    orientation === "h"
      ? [
          { row: row - 1, col },
          { row, col },
        ]
      : [
          { row, col: col - 1 },
          { row, col },
        ];
  return candidates.filter((c) => c.row >= 0 && c.col >= 0 && c.row < gridSize && c.col < gridSize);
}
