"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { toEdgeKey, type EdgeRef, type GameState, type PlayerId } from "../engine";
import { Coin } from "./Coin";

/*
 * El tablero es una matriz de (2N + 1) × (2N + 1) posiciones en CSS Grid:
 *   fila par  + col par   → punto
 *   fila par  + col impar → línea horizontal
 *   fila impar + col par  → línea vertical
 *   fila impar + col impar → celda con moneda
 * Una sola regla genera todo el tablero, para cualquier tamaño N.
 */

export type Seat = "p1" | "p2";

interface BoardProps {
  state: GameState;
  seatOf: (playerId: PlayerId) => Seat;
  /** Asiento de quien juega ahora: colorea el "hover" de las líneas libres. */
  activeSeat: Seat | null;
  interactive: boolean;
  onPlaceEdge: (edge: EdgeRef) => void;
}

const EDGE_COLOR: Record<Seat, string> = {
  p1: "bg-p1 shadow-[0_0_12px] shadow-p1/70",
  p2: "bg-p2 shadow-[0_0_12px] shadow-p2/70",
};
const HOVER_COLOR: Record<Seat, string> = {
  p1: "group-hover:bg-p1/70 group-focus-visible:bg-p1/70",
  p2: "group-hover:bg-p2/70 group-focus-visible:bg-p2/70",
};
const CELL_COLOR: Record<Seat, string> = {
  p1: "bg-p1/15 ring-p1/40",
  p2: "bg-p2/15 ring-p2/40",
};

export function Board({ state, seatOf, activeSeat, interactive, onPlaceEdge }: BoardProps) {
  const n = state.gridSize;
  const track = `repeat(${n}, var(--dot) minmax(0, 1fr)) var(--dot)`;
  const style = {
    "--dot": "0.9rem",
    "--coin-size": `clamp(2rem, ${40 / n}vw, ${12 / n + 1.2}rem)`,
    gridTemplateColumns: track,
    gridTemplateRows: track,
  } as CSSProperties;

  // CSS Grid usa índices desde 1: la posición lógica p se ubica en la línea p + 1.
  const at = (r: number, c: number): CSSProperties => ({ gridRow: r + 1, gridColumn: c + 1 });

  const items = [];
  for (let r = 0; r <= 2 * n; r++) {
    for (let c = 0; c <= 2 * n; c++) {
      const evenRow = r % 2 === 0;
      const evenCol = c % 2 === 0;

      if (evenRow && evenCol) {
        items.push(<span key={`d${r}-${c}`} style={at(r, c)} className="z-10 m-auto size-3.5 rounded-full bg-white shadow" />);
        continue;
      }

      if (!evenRow && !evenCol) {
        const row = (r - 1) / 2;
        const col = (c - 1) / 2;
        const cell = state.cells[row][col];
        const seat = cell.ownerId ? seatOf(cell.ownerId) : null;
        items.push(
          <div
            key={`c${row}-${col}`}
            style={at(r, c)}
            className={cn(
              "relative m-1 grid place-items-center rounded-2xl transition",
              seat && `ring-1 animate-pop ${CELL_COLOR[seat]}`,
            )}
          >
            {seat && (
              <span className={cn("absolute top-1 right-1 rounded px-1 text-[10px] font-bold text-slate-950", seat === "p1" ? "bg-p1" : "bg-p2")}>
                {seat.toUpperCase()}
              </span>
            )}
            <Coin value={cell.value} className={cn(seat && "opacity-80")} />
          </div>,
        );
        continue;
      }

      // Líneas: horizontal si la fila es par, vertical si es impar.
      const edge: EdgeRef = evenRow
        ? { orientation: "h", row: r / 2, col: (c - 1) / 2 }
        : { orientation: "v", row: (r - 1) / 2, col: c / 2 };
      const ownerId = state.edges[toEdgeKey(edge)];
      const ownerSeat = ownerId ? seatOf(ownerId) : null;
      const canClick = interactive && !ownerId;
      const label = `Línea ${edge.orientation === "h" ? "horizontal" : "vertical"}, fila ${edge.row + 1}, columna ${edge.col + 1}`;

      items.push(
        <button
          key={toEdgeKey(edge)}
          type="button"
          style={at(r, c)}
          disabled={!canClick}
          onClick={() => onPlaceEdge(edge)}
          aria-label={ownerId ? `${label} (ocupada)` : label}
          // Área de clic más grande que la línea visible (ley de Fitts): más fácil de tocar en móvil.
          className={cn(
            "group relative flex items-center justify-center outline-none",
            evenRow ? "-my-2 h-[calc(100%+1rem)] px-0.5" : "-mx-2 w-[calc(100%+1rem)] py-0.5",
            canClick && "cursor-pointer",
          )}
        >
          <span
            className={cn(
              "block rounded-full transition-all duration-200",
              evenRow ? "h-1.5 w-full" : "h-full w-1.5",
              ownerSeat ? EDGE_COLOR[ownerSeat] : "bg-slate-600/60",
              canClick && activeSeat && HOVER_COLOR[activeSeat],
            )}
          />
        </button>,
      );
    }
  }

  return (
    <div
      className="grid aspect-square w-full max-w-[min(92vw,34rem)] rounded-card border border-white/10 bg-surface/70 p-4 shadow-2xl shadow-black/40 sm:p-6"
      style={style}
      role="group"
      aria-label={`Tablero de ${n} por ${n}`}
    >
      {items}
    </div>
  );
}
