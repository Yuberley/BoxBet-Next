import { cn, formatCompact } from "@/lib/utils";

/** El material de la moneda se deriva de su valor: una sola regla, no un color por moneda. */
function material(value: number) {
  if (value >= 200) return "coin-gold";
  if (value >= 50) return "coin-silver";
  return "coin-bronze";
}

export function Coin({ value, className }: { value: number; className?: string }) {
  return <span className={cn("coin", material(value), className)}>{formatCompact(value)}</span>;
}

/** Icono pequeño de la moneda del juego, para acompañar montos. */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("coin coin-gold inline-grid align-middle [--coin-size:1.1rem]", className)}
    >
      K
    </span>
  );
}
