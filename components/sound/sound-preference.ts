"use client";

import { useCallback, useSyncExternalStore } from "react";
import { playSound, type SoundName } from "@/lib/sound";

/*
 * Preferencia de sonido guardada en localStorage.
 * useSyncExternalStore conecta React con un estado que vive FUERA de React,
 * y evita errores de hidratación (el servidor no conoce localStorage).
 */
const KEY = "boxbet:sound";
const listeners = new Set<() => void>();

function readEnabled() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    // Modo privado o almacenamiento bloqueado: la preferencia no persiste, pero la app sigue.
  }
  listeners.forEach((listener) => listener());
}

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, readEnabled, () => true);
}

/** Devuelve una función `play` que respeta la preferencia del usuario. */
export function useSound() {
  const enabled = useSoundEnabled();
  // useCallback: misma referencia entre renders, segura como dependencia de efectos.
  return useCallback(
    (name: SoundName) => {
      if (enabled) playSound(name);
    },
    [enabled],
  );
}
