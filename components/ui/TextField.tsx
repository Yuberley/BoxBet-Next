import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Campo de texto con etiqueta asociada (useId garantiza un id único y estable en SSR). */
export function TextField({ label, className, ...props }: ComponentProps<"input"> & { label: string }) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className="h-12 w-full rounded-2xl border border-line bg-canvas-deep/60 px-4 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
        {...props}
      />
    </div>
  );
}
