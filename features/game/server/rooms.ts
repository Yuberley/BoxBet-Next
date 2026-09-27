import "server-only";

import { createAdmin } from "@/lib/supabase/server";
import { resolveTimeouts, type GameError, type GameResultOf, type GameState } from "../engine";
import type { RoomSnapshot } from "../room";

/*
 * Repositorio de salas: única puerta entre el juego y la base de datos.
 * Si mañana cambiamos Supabase por otra DB, solo cambia este archivo.
 */

const STALE_AFTER_HOURS = 6;

export async function loadRoom(code: string): Promise<RoomSnapshot | null> {
  const { data, error } = await createAdmin()
    .from("rooms")
    .select("code, state, version")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data as RoomSnapshot | null;
}

/** Inserta una sala con un código de 4 dígitos libre. Si choca con uno existente, prueba otro. */
export async function insertRoom(state: GameState, hostId: string): Promise<RoomSnapshot> {
  const db = createAdmin();
  // Limpieza perezosa: las salas abandonadas se borran cuando alguien crea una nueva.
  await db
    .from("rooms")
    .delete()
    .lt("updated_at", new Date(Date.now() - STALE_AFTER_HOURS * 3_600_000).toISOString());

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const { error } = await db.from("rooms").insert({ code, state, status: state.status, host_id: hostId });
    if (!error) return { code, state, version: 0 };
    if (error.code !== "23505") throw error; // 23505 = clave duplicada en Postgres
  }
  throw new Error("No hay códigos de sala disponibles, intenta de nuevo.");
}

export async function deleteRoom(code: string) {
  await createAdmin().from("rooms").delete().eq("code", code);
}

type Mutation = (state: GameState, now: number) => GameResultOf | GameState;
export type MutateResult = { ok: true; room: RoomSnapshot } | { ok: false; error: GameError | "NOT_FOUND" | "CONFLICT" };

/**
 * Lee → aplica una función pura del motor → escribe SOLO si nadie escribió antes (compare-and-swap).
 * Si dos jugadores actúan a la vez, uno gana y el otro reintenta con el estado fresco.
 * Antes de cada mutación se resuelven los timeouts vencidos (reloj perezoso).
 */
export async function mutateRoom(code: string, mutation: Mutation): Promise<MutateResult> {
  const db = createAdmin();

  for (let attempt = 0; attempt < 3; attempt++) {
    const room = await loadRoom(code);
    if (!room) return { ok: false, error: "NOT_FOUND" };

    const now = Date.now();
    const current = resolveTimeouts(room.state, now, Math.random);
    const outcome = mutation(current, now);
    const result = "ok" in outcome ? outcome : { ok: true as const, state: outcome };
    if (!result.ok) return result;

    // Nada cambió: no escribimos (evita tráfico y eventos Realtime inútiles).
    if (result.state === room.state) return { ok: true, room };

    const { data, error } = await db
      .from("rooms")
      .update({
        state: result.state,
        status: result.state.status,
        version: room.version + 1,
        updated_at: new Date(now).toISOString(),
      })
      .eq("code", code)
      .eq("version", room.version) // ← la condición que hace el compare-and-swap
      .select("code, state, version")
      .maybeSingle();

    if (error) throw error;
    if (data) return { ok: true, room: data as RoomSnapshot };
    // data === null → otro request cambió la versión primero: reintentamos.
  }
  return { ok: false, error: "CONFLICT" };
}
