import { describe, expect, it } from "vitest";
import { createGame, forfeit, joinGame, seededRandom, type GameState } from "./engine";
import { describeResult, rankPlayers } from "./result-copy";

const alice = { id: "alice", nickname: "Alice", avatarId: "fire" };
const bob = { id: "bob", nickname: "Bob", avatarId: "star" };

function abandonedByAlice(): GameState {
  const game = createGame({ host: alice, bet: 100, now: 0, random: seededRandom(1) });
  const joined = joinGame(game, bob, 0);
  if (!joined.ok) throw new Error(joined.error);
  const result = forfeit(joined.state, "alice", 0);
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

describe("textos del resultado según quién mira", () => {
  it("quien abandona no lee 'tu rival abandonó'", () => {
    expect(describeResult(abandonedByAlice(), "alice").subtitle).toBe("Te retiraste: la victoria es para Bob.");
  });

  it("quien gana por abandono lo celebra", () => {
    expect(describeResult(abandonedByAlice(), "bob").title).toEqual(["¡Victoria por", "abandono!"]);
  });

  it("en un abandono el ganador queda 1.º aunque ambos tengan 0", () => {
    const [first, second] = rankPlayers(abandonedByAlice());
    expect([first.playerId, first.rank, second.rank]).toEqual(["bob", 1, 2]);
  });
});
