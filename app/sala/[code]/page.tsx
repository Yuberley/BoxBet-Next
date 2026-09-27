import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { RoomClient } from "@/features/game/components/RoomClient";
import { ROOM_CODE_PATTERN } from "@/features/game/room";
import { loadRoom } from "@/features/game/server/rooms";
import { getPlayerId } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/sala/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `Sala ${code}` };
}

/*
 * Server Component: busca la sala y la identidad EN EL SERVIDOR, antes de enviar HTML.
 * El navegador recibe la página ya pintada; luego RoomClient toma el control en vivo.
 */
export default async function RoomPage({ params }: PageProps<"/sala/[code]">) {
  const { code } = await params; // En Next 15+ `params` es una Promesa.
  if (!ROOM_CODE_PATTERN.test(code)) notFound();

  // Consultas independientes en paralelo: el tiempo total es el de la más lenta, no la suma.
  const [room, playerId, cookieStore] = await Promise.all([loadRoom(code), getPlayerId(), cookies()]);
  if (!room) notFound();

  return (
    <RoomClient
      // Cambiar de sala o de identidad monta un componente nuevo (estado limpio).
      key={`${code}:${playerId}`}
      initialRoom={room}
      playerId={playerId}
      defaultNickname={cookieStore.get("boxbet_nickname")?.value ?? ""}
    />
  );
}
