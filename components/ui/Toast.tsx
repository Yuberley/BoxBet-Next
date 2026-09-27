"use client";

import { useEffect, useEffectEvent } from "react";
import { CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: number;
  text: string;
  tone: "error" | "info";
}

/**
 * Aviso temporal ("toast").
 *   - error → role="alert" (se anuncia de inmediato); info → role="status" (se anuncia sin interrumpir).
 *   - Se cierra solo, con más tiempo para errores (hay que leerlos y entenderlos).
 *   - Botón de cierre explícito, accesible por teclado.
 */
export function Toast({ message, onClose }: { message: ToastMessage; onClose: () => void }) {
  const close = useEffectEvent(onClose);
  const duration = message.tone === "error" ? 6000 : 4000;

  useEffect(() => {
    const timer = setTimeout(() => close(), duration);
    return () => clearTimeout(timer);
  }, [message.id, duration]);

  const Icon = message.tone === "error" ? CircleAlert : Info;
  return (
    <div
      role={message.tone === "error" ? "alert" : "status"}
      className={cn(
        "fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-sm animate-fade-up items-center gap-3 rounded-2xl px-4 py-3 font-semibold shadow-xl",
        message.tone === "error" ? "bg-danger text-slate-950" : "border border-white/10 bg-surface-2 text-slate-100",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="flex-1">{message.text}</span>
      <button type="button" onClick={onClose} aria-label="Cerrar aviso" className="rounded-full p-1 hover:bg-black/10">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
