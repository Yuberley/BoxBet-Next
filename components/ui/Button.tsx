import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Variantes con nombre semántico (qué comunica), no visual (de qué color es).
const variants = {
  primary: "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover",
  secondary: "bg-white text-slate-900 hover:bg-slate-200",
  ghost: "text-muted hover:bg-white/5 hover:text-white",
  turn: "bg-p1 text-slate-950 shadow-lg shadow-p1/30 hover:brightness-110",
};

const sizes = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-8 text-lg",
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-display font-bold transition",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
