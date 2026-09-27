"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

/**
 * Entrada de código de N dígitos (estilo OTP) con avance automático, borrar y pegar.
 * Envía el valor unido en un input oculto `name` → funciona dentro de cualquier <form>.
 */
export function CodeInput({ name, length = 4, defaultValue = "" }: { name: string; length?: number; defaultValue?: string }) {
  const [digits, setDigits] = useState(() => Array.from({ length }, (_, i) => defaultValue[i] ?? ""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focus = (index: number) => refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  function update(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => prev.map((d, i) => (i === index ? digit : d)));
    if (digit) focus(index + 1);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index]) focus(index - 1);
    if (event.key === "ArrowLeft") focus(index - 1);
    if (event.key === "ArrowRight") focus(index + 1);
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length }, (_, i) => pasted[i] ?? ""));
    focus(pasted.length);
  }

  return (
    <div className="flex justify-center gap-3" role="group" aria-label="Código de acceso">
      <input type="hidden" name={name} value={digits.join("")} />
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => update(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`Dígito ${index + 1} de ${length}`}
          placeholder="–"
          className="h-18 w-14 rounded-full border-2 border-line bg-surface text-center font-display text-3xl font-bold text-white placeholder:text-slate-500 focus:border-accent focus:outline-none sm:w-16"
        />
      ))}
    </div>
  );
}
