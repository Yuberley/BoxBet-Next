"use client";

import { useActionState, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Box, KeyRound, LogIn, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, Well } from "@/components/ui/Card";
import { CodeInput } from "@/components/ui/CodeInput";
import { cn } from "@/lib/utils";
import { createRoomAction, joinRoomAction } from "../actions";
import { BetPicker } from "./BetPicker";

/**
 * UN formulario, DOS acciones: el apodo es compartido y cada botón usa su propio `formAction`.
 * useActionState guarda el resultado (errores) y el estado "pendiente" de cada acción.
 *
 * UX de errores: cada error se muestra JUNTO al campo que lo causó, el campo queda marcado
 * (aria-invalid + borde rojo), se asocia con aria-describedby y recibe el foco.
 */
export function LobbyForm({ defaultNickname, defaultCode }: { defaultNickname: string; defaultCode?: string }) {
  const [createState, createAction, creating] = useActionState(createRoomAction, undefined);
  const [joinState, joinAction, joining] = useActionState(joinRoomAction, undefined);
  // Solo mostramos el resultado de la ÚLTIMA acción usada (evita errores viejos de la otra tarjeta).
  const [lastAction, setLastAction] = useState<"create" | "join" | null>(null);
  const result = lastAction === "create" ? createState : lastAction === "join" ? joinState : undefined;
  const busy = creating || joining;

  // Controlado: React 19 resetea los campos no controlados al terminar una acción, incluso con error.
  const [nickname, setNickname] = useState(defaultNickname);
  const nicknameRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);
  const ids = { nickname: useId(), code: useId(), create: useId() };

  const nicknameError = result?.field === "nickname" ? result.error : undefined;
  const codeError = result?.field === "code" ? result.error : undefined;
  const generalError = result?.error && !result.field ? result.error : undefined;

  // Llevar el foco al campo con error: el usuario no tiene que buscar qué falló.
  useEffect(() => {
    if (result?.field === "nickname") nicknameRef.current?.focus();
    if (result?.field === "code") codeRef.current?.querySelector<HTMLInputElement>("input:not([type=hidden])")?.focus();
  }, [result]);

  // Enter dentro del código debe UNIRSE, no "Generar código" (que es el primer botón del formulario).
  function onCodeKeyDown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    joinButtonRef.current?.click();
  }

  return (
    <form className="mx-auto w-full max-w-6xl space-y-8 px-4">
      <div className="mx-auto max-w-sm">
        <label
          className={cn(
            "flex items-center gap-3 rounded-full border bg-surface px-5 focus-within:border-accent",
            nicknameError ? "border-danger" : "border-line",
          )}
        >
          <UserRound className="size-5 text-muted" aria-hidden />
          <span className="sr-only">Tu apodo</span>
          <input
            ref={nicknameRef}
            name="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Tu apodo"
            minLength={2}
            maxLength={16}
            required
            autoComplete="nickname"
            aria-invalid={Boolean(nicknameError)}
            aria-describedby={ids.nickname}
            className="h-12 flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        {/* Texto de ayuda que se convierte en error: siempre existe, así el layout no salta. */}
        <p id={ids.nickname} className={cn("mt-2 text-center text-sm", nicknameError ? "text-danger" : "text-muted")}>
          {nicknameError ?? "Así te verá tu rival (2 a 16 caracteres)."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="relative flex flex-col gap-6 overflow-hidden">
          <Plus className="pointer-events-none absolute -top-4 -right-4 size-36 text-white/[0.03]" aria-hidden />
          <header>
            <h2 className="flex items-center gap-3 font-display text-3xl font-bold">
              <Box className="size-7 text-accent" aria-hidden /> Crear sala
            </h2>
            <p className="mt-3 text-muted">Configura el valor de la apuesta para iniciar una nueva partida.</p>
          </header>
          <BetPicker />
          <div className="mt-auto space-y-2">
            {lastAction === "create" && generalError && (
              <p id={ids.create} role="alert" className="text-center text-sm text-danger">
                {generalError}
              </p>
            )}
            <Button formAction={createAction} onClick={() => setLastAction("create")} size="lg" className="w-full" disabled={busy}>
              {creating ? "Creando sala…" : "Generar código"} <ArrowRight className="size-5" aria-hidden />
            </Button>
          </div>
        </Card>

        <Card className="relative flex flex-col gap-6 overflow-hidden">
          <KeyRound className="pointer-events-none absolute -top-4 -right-4 size-36 text-white/[0.03]" aria-hidden />
          <header>
            <h2 className="flex items-center gap-3 font-display text-3xl font-bold">
              <KeyRound className="size-7 text-accent" aria-hidden /> Unirse a sala
            </h2>
            <p className="mt-3 text-muted">Ingresa el código de 4 dígitos que te compartió quien creó la sala.</p>
          </header>
          <Well className="flex flex-1 flex-col items-center justify-center gap-5 py-8" onKeyDown={onCodeKeyDown}>
            <p className="text-sm font-semibold tracking-[0.2em] text-muted">CÓDIGO DE ACCESO</p>
            <div ref={codeRef}>
              <CodeInput name="code" defaultValue={defaultCode} invalid={Boolean(codeError)} describedBy={ids.code} />
            </div>
            <p id={ids.code} role={codeError ? "alert" : undefined} className={cn("min-h-5 text-sm", codeError ? "text-danger" : "text-muted")}>
              {codeError ?? (lastAction === "join" ? generalError : undefined) ?? "Puedes pegar el código completo."}
            </p>
          </Well>
          <Button
            ref={joinButtonRef}
            formAction={joinAction}
            onClick={() => setLastAction("join")}
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={busy}
          >
            <LogIn className="size-5" aria-hidden /> {joining ? "Entrando…" : "Entrar a la mesa"}
          </Button>
        </Card>
      </div>
    </form>
  );
}
