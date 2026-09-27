import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { BET_OPTIONS, BOARD_TIERS, CURRENCY, PLACE_SECONDS, ROLL_SECONDS } from "@/features/game/engine";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Reglas" };

// Página 100 % estática: Next la pre-renderiza en el build. Los datos vienen de las
// mismas constantes que usa el motor, así las reglas escritas nunca se desincronizan del código.
export default function RulesPage() {
  const steps = [
    `Cada jugador apuesta lo mismo; el pozo (apuesta × 2) se reparte en monedas sobre el tablero.`,
    `En tu turno lanzas el dado (tienes ${ROLL_SECONDS} s) y trazas tantas líneas como salió (tienes ${PLACE_SECONDS} s).`,
    `Si cierras los 4 lados de una celda, te quedas con su moneda.`,
    `Si se te acaba el tiempo, el servidor juega por ti: lanza el dado o traza líneas al azar.`,
    `Cuando no quedan monedas, gana quien reunió más ${CURRENCY.plural}.`,
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
      <h1 className="font-display text-5xl font-extrabold">Reglas</h1>
      <Card>
        <ol className="list-decimal space-y-3 pl-5 text-slate-300 marker:font-bold marker:text-primary">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>
      <Card>
        <h2 className="mb-4 font-display text-2xl font-bold">Tableros según la apuesta</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2">Apuesta</th>
              <th>Tablero</th>
              <th>Monedas posibles</th>
            </tr>
          </thead>
          <tbody>
            {BET_OPTIONS.map((bet) => {
              const tier = BOARD_TIERS.find((t) => bet * 2 <= t.maxPot)!;
              return (
                <tr key={bet} className="border-t border-white/5">
                  <td className="py-2 font-semibold">{formatMoney(bet)}</td>
                  <td>
                    {tier.gridSize}×{tier.gridSize}
                  </td>
                  <td className="text-muted">{tier.denominations.join(" · ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-muted">
          Los {CURRENCY.plural} ({CURRENCY.symbol}) son una moneda ficticia: no tienen valor real.
        </p>
      </Card>
      <Link href="/" className="inline-block font-semibold text-primary underline">
        Ir a jugar
      </Link>
    </div>
  );
}
