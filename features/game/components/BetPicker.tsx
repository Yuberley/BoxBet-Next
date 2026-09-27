"use client";

import { useState } from "react";
import { Well } from "@/components/ui/Card";
import { cn, formatMoney } from "@/lib/utils";
import { BET_OPTIONS, CURRENCY, getBoardTier } from "../engine";

/**
 * Selector de apuesta con radios nativos: accesibles por teclado y enviados en el
 * FormData del formulario sin JavaScript extra (name="bet").
 */
export function BetPicker({ defaultValue = 1000 }: { defaultValue?: number }) {
  const [bet, setBet] = useState(defaultValue);
  const { gridSize } = getBoardTier(bet * 2);

  return (
    <Well>
      <fieldset>
        <legend className="sr-only">Valor de la apuesta</legend>
        <div className="mb-5 flex items-end justify-between gap-4">
          <p className="text-sm tracking-wide text-muted">
            APUESTA ACTUAL
            <span className="mt-1 block text-xs">
              Tablero {gridSize}×{gridSize} · pozo {formatMoney(bet * 2)}
            </span>
          </p>
          <p className="text-right">
            <span className="block font-display text-4xl font-extrabold text-accent tabular-nums">
              {formatMoney(bet, false)}
            </span>
            <span className="text-xs font-semibold text-muted">{CURRENCY.plural.toUpperCase()}</span>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BET_OPTIONS.map((option) => (
            <label
              key={option}
              className={cn(
                "cursor-pointer rounded-full py-2 text-center text-sm font-bold transition",
                "has-focus-visible:outline-2 has-focus-visible:outline-accent",
                bet === option ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-700/60 hover:bg-slate-600",
              )}
            >
              <input
                type="radio"
                name="bet"
                value={option}
                checked={bet === option}
                onChange={() => setBet(option)}
                className="sr-only"
              />
              {formatMoney(option, false)}
            </label>
          ))}
        </div>
      </fieldset>
    </Well>
  );
}
