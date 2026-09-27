"use client";

import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled, useSoundEnabled } from "./sound-preference";

export function SoundToggle() {
  const enabled = useSoundEnabled();
  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!enabled)}
      // aria-pressed comunica a lectores de pantalla que es un interruptor.
      aria-pressed={enabled}
      className="flex items-center gap-2 rounded-full px-2.5 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only sm:not-sr-only">Sonido</span>
    </button>
  );
}
