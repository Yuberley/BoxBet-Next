"use client";

import { useActionState, useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { formatMoney } from "@/lib/utils";
import { joinRoomAction } from "../actions";
import type { GameState } from "../engine";
import { Avatar } from "./Avatar";

/** Quien llega por un enlace de invitación ve esta tarjeta en lugar de la sala de espera. */
export function JoinInvite({ code, state, defaultNickname }: { code: string; state: GameState; defaultNickname: string }) {
  const [result, action, pending] = useActionState(joinRoomAction, undefined);
  const [nickname, setNickname] = useState(defaultNickname);
  const host = state.players[0];

  return (
    <form action={action} className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="space-y-6 text-center">
        <Avatar avatarId={host.avatarId} size="lg" className="mx-auto" />
        <div>
          <h1 className="font-display text-3xl font-bold">{host.nickname} te desafía</h1>
          <p className="mt-1 text-muted">
            Sala {code} · apuesta de {formatMoney(state.bet)}
          </p>
        </div>
        <input type="hidden" name="code" value={code} />
        <TextField
          label="Tu apodo"
          name="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          minLength={2}
          maxLength={16}
          required
          autoComplete="nickname"
          hint="Así te verá tu rival (2 a 16 caracteres)."
          error={result?.field === "nickname" ? result.error : undefined}
          className="text-left"
        />
        {result?.error && result.field !== "nickname" && (
          <p role="alert" className="text-sm text-danger">
            {result.error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <LogIn className="size-5" aria-hidden /> {pending ? "Entrando…" : "Aceptar desafío"}
        </Button>
      </Card>
    </form>
  );
}
