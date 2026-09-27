"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Box, KeyRound, LogIn, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, Well } from "@/components/ui/Card";
import { CodeInput } from "@/components/ui/CodeInput";
import { createRoomAction, joinRoomAction } from "../actions";
import { BetPicker } from "./BetPicker";

/**
 * UN formulario, DOS acciones: el apodo es compartido y cada botón usa su propio `formAction`.
 * useActionState guarda el resultado (errores) y el estado "pendiente" de cada acción.
 */
export function LobbyForm({ defaultNickname, defaultCode }: { defaultNickname: string; defaultCode?: string }) {
  const [createState, createAction, creating] = useActionState(createRoomAction, undefined);
  const [joinState, joinAction, joining] = useActionState(joinRoomAction, undefined);
  const error = createState?.error ?? joinState?.error;
  const busy = creating || joining;
  // Controlado: React 19 resetea los campos no controlados al terminar una acción, incluso con error.
  const [nickname, setNickname] = useState(defaultNickname);

  return (
    <form className="mx-auto w-full max-w-6xl space-y-8 px-4">
      <div className="mx-auto max-w-sm">
        <label className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 focus-within:border-primary">
          <UserRound className="size-5 text-muted" aria-hidden />
          <span className="sr-only">Tu apodo</span>
          <input
            name="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Tu apodo"
            minLength={2}
            maxLength={16}
            required
            autoComplete="nickname"
            className="h-12 flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        {/* role="alert": el lector de pantalla lee el error apenas aparece. */}
        <p role="alert" className="mt-2 min-h-5 text-center text-sm text-danger">
          {error}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="relative flex flex-col gap-6 overflow-hidden">
          <Plus className="pointer-events-none absolute -top-4 -right-4 size-36 text-white/[0.03]" aria-hidden />
          <header>
            <h2 className="flex items-center gap-3 font-display text-3xl font-bold">
              <Box className="size-7 text-primary" aria-hidden /> Crear sala
            </h2>
            <p className="mt-3 text-muted">Configura el valor de la apuesta para iniciar una nueva partida.</p>
          </header>
          <BetPicker />
          <Button formAction={createAction} size="lg" className="mt-auto w-full" disabled={busy}>
            {creating ? "Creando sala…" : "Generar código"} <ArrowRight className="size-5" aria-hidden />
          </Button>
        </Card>

        <Card className="relative flex flex-col gap-6 overflow-hidden">
          <KeyRound className="pointer-events-none absolute -top-4 -right-4 size-36 text-white/[0.03]" aria-hidden />
          <header>
            <h2 className="flex items-center gap-3 font-display text-3xl font-bold">
              <KeyRound className="size-7 text-primary" aria-hidden /> Unirse a sala
            </h2>
            <p className="mt-3 text-muted">Ingresa el código de 4 dígitos que te compartió quien creó la sala.</p>
          </header>
          <Well className="flex flex-1 flex-col items-center justify-center gap-5 py-8">
            <p className="text-sm font-semibold tracking-[0.2em] text-muted">CÓDIGO DE ACCESO</p>
            <CodeInput name="code" defaultValue={defaultCode} />
          </Well>
          <Button formAction={joinAction} variant="secondary" size="lg" className="w-full" disabled={busy}>
            <LogIn className="size-5" aria-hidden /> {joining ? "Entrando…" : "Entrar a la mesa"}
          </Button>
        </Card>
      </div>
    </form>
  );
}
