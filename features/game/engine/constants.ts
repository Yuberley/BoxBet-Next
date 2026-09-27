// Reglas configurables del juego en un solo lugar (evita "números mágicos" regados por el código).

/** Moneda ficticia del juego. */
export const CURRENCY = { name: "Kubo", plural: "Kubos", symbol: "KB" } as const;

export const BET_OPTIONS = [100, 500, 1000, 2000] as const;
export type BetOption = (typeof BET_OPTIONS)[number];

export const MAX_PLAYERS = 2;
export const DICE_FACES = 6;

/** Segundos para lanzar el dado y para colocar las líneas. */
export const ROLL_SECONDS = 30;
export const PLACE_SECONDS = 90;

/** Cuántas entradas del historial conservamos (el estado no debe crecer sin límite). */
export const LOG_LIMIT = 30;

interface BoardTier {
  /** Pozo máximo (inclusive) para este nivel. */
  maxPot: number;
  gridSize: number;
  denominations: number[];
}

/** A mayor pozo, tablero más grande y monedas más valiosas. */
export const BOARD_TIERS: BoardTier[] = [
  { maxPot: 500, gridSize: 3, denominations: [10, 20, 50, 100] },
  { maxPot: 1000, gridSize: 4, denominations: [10, 20, 50, 100, 200] },
  { maxPot: 2000, gridSize: 5, denominations: [10, 20, 50, 100, 200, 500] },
  { maxPot: Infinity, gridSize: 5, denominations: [20, 50, 100, 200, 500] },
];

export function getBoardTier(pot: number): BoardTier {
  return BOARD_TIERS.find((tier) => pot <= tier.maxPot) ?? BOARD_TIERS[BOARD_TIERS.length - 1];
}
