import { describe, expect, it } from "vitest";
import { allEdges, toEdgeKey, type EdgeRef } from "../engine";
import { nextEdgeInDirection, type Direction } from "./board-navigation";

const edges = allEdges(3);
const h = (row: number, col: number): EdgeRef => ({ orientation: "h", row, col });
const v = (row: number, col: number): EdgeRef => ({ orientation: "v", row, col });
const go = (from: EdgeRef, dir: Direction) => {
  const next = nextEdgeInDirection(from, edges, dir);
  return next && toEdgeKey(next);
};

describe("navegación con flechas en el tablero", () => {
  it("desde una línea horizontal, ↓ baja a la vertical más cercana", () => {
    expect(go(h(0, 0), "down")).toMatch(/^v:0:/);
  });

  it("en el borde no hay a dónde ir: se queda (null)", () => {
    expect(go(h(0, 0), "up")).toBeNull();
    expect(go(v(0, 0), "left")).toBeNull();
  });

  it("pulsando → repetidamente se recorre toda la fila", () => {
    const visited = new Set<string>();
    let current: EdgeRef | null = h(0, 0);
    while (current) {
      visited.add(toEdgeKey(current));
      current = nextEdgeInDirection(current, edges, "right");
    }
    expect(visited).toContain("h:0:2");
  });

  it.each([3, 4, 5])("en un tablero %i×%i todas las líneas son alcanzables con flechas", (size) => {
    const edges = allEdges(size);
    const reached = new Set([toEdgeKey(h(0, 0))]);
    const queue: EdgeRef[] = [h(0, 0)];
    while (queue.length) {
      const edge = queue.shift()!;
      for (const dir of ["up", "down", "left", "right"] as const) {
        const next = nextEdgeInDirection(edge, edges, dir);
        if (next && !reached.has(toEdgeKey(next))) {
          reached.add(toEdgeKey(next));
          queue.push(next);
        }
      }
    }
    expect(reached.size).toBe(edges.length);
  });
});
