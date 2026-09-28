import { getScores, type GameState, type PlayerId } from "./engine";

/*
 * Microcopy de la pantalla de resultados. El texto DEPENDE DE QUIÉN MIRA:
 * "tu rival abandonó" es verdad para uno y falso para el otro.
 * Como función pura, cada caso se puede probar sin renderizar nada.
 */

export interface ResultCopy {
  /** [parte normal, parte resaltada] del título. */
  title: [string, string];
  subtitle: string;
}

export function describeResult(state: GameState, viewerId: PlayerId | null): ResultCopy {
  const winnerId = state.result?.winnerId ?? null;
  const name = (id: PlayerId | null) => state.players.find((p) => p.id === id)?.nickname ?? "";
  const loserId = state.players.find((p) => p.id !== winnerId)?.id ?? null;

  if (!winnerId) return { title: ["¡Empate", "técnico!"], subtitle: "Mismo puntaje: la mesa queda igualada." };

  if (state.result?.reason === "forfeit") {
    if (viewerId === loserId) return { title: ["Partida", "abandonada"], subtitle: `Te retiraste: la victoria es para ${name(winnerId)}.` };
    const exclamation = viewerId === winnerId;
    return {
      title: exclamation ? ["¡Victoria por", "abandono!"] : ["Victoria por", "abandono"],
      subtitle: `${name(loserId)} se retiró de la mesa.`,
    };
  }

  if (viewerId && viewerId !== winnerId) return { title: ["Buena", "partida"], subtitle: `Ganó ${name(winnerId)}. ¡La próxima es tuya!` };
  return { title: ["¡Victoria", "absoluta!"], subtitle: "La mesa ha hablado. Estos son los resultados." };
}

/**
 * Tabla de posiciones: ordena por puntaje y comparte el puesto en empates (1, 1).
 * En un abandono gana el que se quedó, aunque tengan el mismo puntaje.
 */
export function rankPlayers(state: GameState) {
  const scores = getScores(state);
  const winnerId = state.result?.winnerId ?? null;
  const forfeit = state.result?.reason === "forfeit";
  const rows = state.players.map((player) => ({ player, ...scores.find((s) => s.playerId === player.id)! }));

  rows.sort((a, b) => (forfeit ? Number(b.playerId === winnerId) - Number(a.playerId === winnerId) : 0) || b.money - a.money);
  return rows.map((row, index) => ({
    ...row,
    rank: forfeit ? index + 1 : rows.findIndex((r) => r.money === row.money) + 1,
  }));
}
