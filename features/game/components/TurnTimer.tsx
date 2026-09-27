"use client";

import { Timer } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { useNow } from "../hooks/useNow";

/** Muestra la cuenta regresiva. Solo DIBUJA el tiempo: quien decide el vencimiento es el servidor. */
export function TurnTimer({ deadline }: { deadline: number }) {
  const now = useNow();
  const remaining = now === null ? null : deadline - now;
  const urgent = remaining !== null && remaining <= 10_000;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-white/10 bg-canvas-deep px-4 py-2 font-mono text-lg font-bold",
        urgent ? "animate-pulse text-danger" : "text-slate-100",
      )}
      role="timer"
      aria-label="Tiempo restante del turno"
    >
      <Timer className="size-5 text-p1" aria-hidden />
      {remaining === null ? "--:--" : formatDuration(remaining)}
    </div>
  );
}
