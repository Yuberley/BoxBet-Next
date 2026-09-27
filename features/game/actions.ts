"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayerId } from "@/lib/supabase/server";
import { pickAvatar } from "./avatars";
import {
  BET_OPTIONS,
  createGame,
  forfeit,
  isValidEdge,
  joinGame,
  placeEdge,
  rollDice,
  setRematch,
  type EdgeRef,
  type GameState,
  type Player,
} from "./engine";
import { GAME_ERROR_MESSAGES, ROOM_CODE_PATTERN, type ActionResult, type FormState } from "./room";
import { deleteRoom, insertRoom, loadRoom, mutateRoom, type MutateResult } from "./server/rooms";

/*
 * Server Actions: los ÚNICOS puntos de entrada que modifican una partida.
 * Cualquiera puede invocarlas con un POST, así que cada una:
 *   1. identifica al jugador (JWT verificado)
 *   2. valida la entrada (nunca confiar en el cliente)
 *   3. delega las reglas al motor puro
 */

const NICKNAME_COOKIE = "boxbet_nickname";

function readNickname(formData: FormData): string | null {
  const nickname = String(formData.get("nickname") ?? "").trim().replace(/\s+/g, " ");
  return nickname.length >= 2 && nickname.length <= 16 ? nickname : null;
}

async function rememberNickname(nickname: string) {
  (await cookies()).set(NICKNAME_COOKIE, nickname, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

const MUTATE_ERRORS = {
  ...GAME_ERROR_MESSAGES,
  NOT_FOUND: "La sala no existe.",
  CONFLICT: "Hubo un choque de jugadas, intenta de nuevo.",
};

function toActionResult(result: MutateResult): ActionResult {
  return result.ok ? result : { ok: false, error: MUTATE_ERRORS[result.error] };
}

async function requirePlayer(): Promise<string> {
  const id = await getPlayerId();
  if (!id) throw new Error("Sesión no válida. Recarga la página.");
  return id;
}

/** Ejecuta `fn` y convierte cualquier fallo de infraestructura en un mensaje para el formulario. */
async function attempt<T>(fn: () => Promise<T>): Promise<{ value: T } | { error: string }> {
  try {
    return { value: await fn() };
  } catch (error) {
    console.error(error);
    return { error: "No pudimos conectar con el servidor del juego. Intenta de nuevo." };
  }
}

// ─── Formularios (useActionState) ───────────────────────────────────────────

export async function createRoomAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const nickname = readNickname(formData);
  if (!nickname) return { error: "Escribe un apodo de 2 a 16 caracteres.", field: "nickname" };

  const bet = Number(formData.get("bet"));
  if (!BET_OPTIONS.includes(bet as (typeof BET_OPTIONS)[number])) return { error: "Apuesta inválida." };

  const created = await attempt(async () => {
    const playerId = await getPlayerId({ create: true });
    if (!playerId) throw new Error("Sin sesión");
    const host: Player = { id: playerId, nickname, avatarId: pickAvatar() };
    return insertRoom(createGame({ host, bet, now: Date.now(), random: Math.random }), playerId);
  });
  if ("error" in created) return created;

  await rememberNickname(nickname);
  // redirect() lanza una excepción especial (por eso va FUERA del try): nada después se ejecuta.
  redirect(`/sala/${created.value.code}`);
}

export async function joinRoomAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const nickname = readNickname(formData);
  if (!nickname) return { error: "Escribe un apodo de 2 a 16 caracteres.", field: "nickname" };

  const code = String(formData.get("code") ?? "");
  if (!ROOM_CODE_PATTERN.test(code)) return { error: "El código debe tener 4 dígitos.", field: "code" };

  const joined = await attempt(async () => {
    const playerId = await getPlayerId({ create: true });
    if (!playerId) throw new Error("Sin sesión");
    return mutateRoom(code, (state, now) => {
      const taken = state.players.map((p) => p.avatarId);
      return joinGame(state, { id: playerId, nickname, avatarId: pickAvatar(taken) }, now);
    });
  });
  if ("error" in joined) return joined;
  const result = joined.value;
  // Si ya estaba dentro (p. ej. recargó), simplemente lo llevamos a la sala.
  if (!result.ok && result.error !== "ALREADY_JOINED") {
    // "Sala no existe" es un problema del código ingresado: lo asociamos a ese campo.
    return { error: MUTATE_ERRORS[result.error], field: result.error === "NOT_FOUND" ? "code" : undefined };
  }

  await rememberNickname(nickname);
  redirect(`/sala/${code}`);
}

// ─── Acciones de juego (llamadas desde la mesa) ─────────────────────────────

export async function rollDiceAction(code: string): Promise<ActionResult> {
  const playerId = await requirePlayer();
  return toActionResult(await mutateRoom(code, (state, now) => rollDice(state, playerId, now, Math.random)));
}

export async function placeEdgeAction(code: string, edge: EdgeRef): Promise<ActionResult> {
  const playerId = await requirePlayer();
  const clean: EdgeRef = { orientation: edge?.orientation, row: Number(edge?.row), col: Number(edge?.col) };
  return toActionResult(
    await mutateRoom(code, (state, now) =>
      isValidEdge(clean, state.gridSize) ? placeEdge(state, playerId, clean, now) : { ok: false, error: "INVALID_EDGE" },
    ),
  );
}

/** Cualquiera en la sala puede "reclamar" un timeout; el servidor decide si de verdad venció. */
export async function claimTimeoutAction(code: string): Promise<ActionResult> {
  return toActionResult(await mutateRoom(code, (state) => state));
}

export async function leaveRoomAction(code: string) {
  const playerId = await requirePlayer();
  const room = await loadRoom(code);

  if (room?.state.status === "waiting" && room.state.players[0]?.id === playerId) {
    await deleteRoom(code); // El anfitrión cancela antes de empezar: la sala desaparece.
  } else if (room?.state.status === "playing") {
    await mutateRoom(code, (state, now) => forfeit(state, playerId, now));
  }
  redirect("/");
}

/** Revancha: el primero crea una sala nueva y la enlaza; el segundo se une a esa sala. */
export async function rematchAction(code: string): Promise<ActionResult> {
  const playerId = await requirePlayer();
  const room = await loadRoom(code);
  if (!room) return { ok: false, error: "La sala no existe." };
  const me = room.state.players.find((p) => p.id === playerId);
  if (!me) return { ok: false, error: GAME_ERROR_MESSAGES.NOT_A_PLAYER };

  let target = room.state.rematchCode;
  if (target) {
    const joined = await mutateRoom(target, (state, now) => joinGame(state, me, now));
    if (!joined.ok && joined.error !== "ALREADY_JOINED") return toActionResult(joined);
  } else {
    const fresh: GameState = createGame({ host: me, bet: room.state.bet, now: Date.now(), random: Math.random });
    target = (await insertRoom(fresh, playerId)).code;
    await mutateRoom(code, (state) => setRematch(state, target!, playerId));
  }
  redirect(`/sala/${target}`);
}
