"use client";

import { useEffect, useId, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  /** Texto de ayuda permanente (se reemplaza por el error cuando lo hay). */
  hint?: string;
  error?: string;
};

/**
 * Campo de texto accesible: <label> asociada (useId → id único y estable en SSR),
 * ayuda/error enlazados con aria-describedby, aria-invalid y foco automático al fallar.
 */
export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? messageId : undefined}
        className={cn(
          "h-12 w-full rounded-2xl border bg-canvas-deep/60 px-4 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none",
          error ? "border-danger" : "border-line",
        )}
        {...props}
      />
      {(hint || error) && (
        <p id={messageId} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
