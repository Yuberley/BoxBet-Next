import type { Metadata } from "next";
import { LocalGame } from "@/features/game/local/LocalGame";

export const metadata: Metadata = { title: "Modo local" };

// La página es un Server Component "delgado": solo compone. La interactividad vive en LocalGame.
export default function LocalPage() {
  return <LocalGame />;
}
