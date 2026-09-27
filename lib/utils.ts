import { CURRENCY } from "@/features/game/engine/constants";

/** Une clases condicionales: cn("a", cond && "b") → "a b". */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const numberFormat = new Intl.NumberFormat("es-CO");

/** 1000 → "1.000 KB". Intl formatea según el idioma (separador de miles, etc.). */
export function formatMoney(value: number, withSymbol = true) {
  const amount = numberFormat.format(value);
  return withSymbol ? `${amount} ${CURRENCY.symbol}` : amount;
}

/** 1000 → "1K" para espacios pequeños como una moneda. */
export function formatCompact(value: number) {
  return value >= 1000 ? `${value / 1000}K` : String(value);
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
