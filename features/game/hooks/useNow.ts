"use client";

import { useSyncExternalStore } from "react";

/*
 * Reloj compartido: un único setInterval para todos los componentes que lo usen.
 * Se activa solo mientras haya suscriptores (y se limpia al desmontar).
 */
let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 250);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Hora actual en ms, actualizada 4 veces por segundo. En el servidor devuelve `null`. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}
