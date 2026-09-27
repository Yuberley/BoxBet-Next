"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoomSnapshot } from "../room";

/**
 * Suscripción en tiempo real a UNA sala.
 *   - postgres_changes: la DB avisa cada vez que cambia la fila → nuevo estado.
 *   - presence: quién tiene la sala abierta ahora mismo (para mostrar "desconectado").
 * El canal se cierra al desmontar el componente (cleanup del efecto).
 */
export function useRoomChannel(
  code: string,
  playerId: string | null,
  handlers: { onUpdate: (room: RoomSnapshot) => void; onDelete: () => void },
) {
  const [onlineIds, setOnlineIds] = useState<ReadonlySet<string>>(new Set());

  // useEffectEvent: siempre ve los handlers más recientes sin volver a suscribirse.
  const onUpdate = useEffectEvent(handlers.onUpdate);
  const onDelete = useEffectEvent(handlers.onDelete);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${code}`, { config: { presence: { key: playerId ?? "spectator" } } })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => onUpdate(payload.new as RoomSnapshot),
      )
      // Supabase no filtra eventos DELETE en el servidor: filtramos aquí por la clave primaria.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms" }, (payload) => {
        if ((payload.old as { code?: string }).code === code) onDelete();
      })
      .on("presence", { event: "sync" }, () => {
        setOnlineIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && playerId) channel.track({ at: Date.now() });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, playerId]);

  return onlineIds;
}
