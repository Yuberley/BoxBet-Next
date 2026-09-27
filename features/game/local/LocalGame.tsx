"use client";

import { useReducer } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { pickAvatar } from "../avatars";
import { BetPicker } from "../components/BetPicker";
import { GameTable } from "../components/GameTable";
import { ResultView } from "../components/ResultView";
import {
  createGame,
  joinGame,
  newSeed,
  placeEdge,
  rollDice,
  seededRandom,
  type EdgeRef,
  type GameState,
} from "../engine";

/*
 * Modo local (dos jugadores, un dispositivo). Usa EXACTAMENTE el mismo motor que el servidor:
 * aquí el "adaptador" es un useReducer en memoria en lugar de una base de datos.
 *
 * Un reducer debe ser puro, así que la hora y la semilla aleatoria viajan dentro de la acción.
 */
type Action =
  | { type: "start"; names: [string, string]; bet: number; seed: number; now: number }
  | { type: "roll"; seed: number; now: number }
  | { type: "place"; edge: EdgeRef; now: number }
  | { type: "reset" };

function reducer(state: GameState | null, action: Action): GameState | null {
  switch (action.type) {
    case "start": {
      const random = seededRandom(action.seed);
      const avatarA = pickAvatar([], random);
      const [a, b] = action.names.map((nickname, i) => ({
        id: `local-${i + 1}`,
        nickname,
        avatarId: i === 0 ? avatarA : pickAvatar([avatarA], random),
      }));
      const game = createGame({ host: a, bet: action.bet, now: action.now, random });
      const joined = joinGame(game, b, action.now);
      return joined.ok ? joined.state : game;
    }
    case "roll": {
      if (!state?.turn) return state;
      const playerId = state.players[state.turn.playerIndex].id;
      const result = rollDice(state, playerId, action.now, seededRandom(action.seed));
      return result.ok ? result.state : state;
    }
    case "place": {
      if (!state?.turn) return state;
      const playerId = state.players[state.turn.playerIndex].id;
      const result = placeEdge(state, playerId, action.edge, action.now);
      return result.ok ? result.state : state;
    }
    case "reset":
      return null;
  }
}

export function LocalGame() {
  const [state, dispatch] = useReducer(reducer, null);

  if (!state) {
    return (
      <form
        className="mx-auto w-full max-w-lg px-4 py-12"
        action={(formData) =>
          dispatch({
            type: "start",
            names: [
              String(formData.get("p1") || "Jugador 1").slice(0, 16),
              String(formData.get("p2") || "Jugador 2").slice(0, 16),
            ],
            bet: Number(formData.get("bet")),
            seed: newSeed(),
            now: Date.now(),
          })
        }
      >
        <Card className="space-y-6">
          <header>
            <h1 className="font-display text-3xl font-bold">Modo local</h1>
            <p className="mt-1 text-muted">Dos jugadores, un mismo dispositivo. Pásalo al terminar tu turno.</p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Jugador 1" name="p1" placeholder="Jugador 1" maxLength={16} />
            <TextField label="Jugador 2" name="p2" placeholder="Jugador 2" maxLength={16} />
          </div>
          <BetPicker />
          <Button type="submit" size="lg" className="w-full">
            <Play className="size-5" aria-hidden /> Empezar partida
          </Button>
        </Card>
      </form>
    );
  }

  if (state.status === "finished") {
    return <ResultView state={state} viewerId={null} onPlayAgain={() => dispatch({ type: "reset" })} />;
  }

  return (
    <GameTable
      state={state}
      viewerId={null}
      canAct
      showTimer={false}
      onRoll={() => dispatch({ type: "roll", seed: newSeed(), now: Date.now() })}
      onPlaceEdge={(edge) => dispatch({ type: "place", edge, now: Date.now() })}
    />
  );
}
