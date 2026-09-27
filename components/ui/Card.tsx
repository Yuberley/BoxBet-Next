import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Superficie base de la app. Composición: el contenido lo decide quien la usa. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-card border border-white/5 bg-surface p-6 shadow-2xl shadow-black/30 sm:p-8",
        className,
      )}
      {...props}
    />
  );
}

/** Caja interna oscura (los "pozos" del mockup). */
export function Well({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-3xl border border-white/5 bg-canvas-deep/60 p-5", className)}
      {...props}
    />
  );
}
