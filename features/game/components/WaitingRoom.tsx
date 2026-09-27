"use client";

import { useState } from "react";
import { Check, Copy, LogOut, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, Well } from "@/components/ui/Card";
import { formatDuration, formatMoney } from "@/lib/utils";
import type { GameState } from "../engine";
import { useNow } from "../hooks/useNow";
import { Avatar } from "./Avatar";
import { CoinIcon } from "./Coin";

interface WaitingRoomProps {
  code: string;
  state: GameState;
  onLeave: () => void;
  leaving: boolean;
}

export function WaitingRoom({ code, state, onLeave, leaving }: WaitingRoomProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const now = useNow();
  const host = state.players[0];

  async function copy(kind: "code" | "link") {
    await navigator.clipboard.writeText(kind === "code" ? code : `${location.origin}/sala/${code}`);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1800);
  }

  // Mejora progresiva: en el celular abre la hoja nativa de compartir (WhatsApp, etc.);
  // donde no existe la Web Share API, copia el enlace.
  async function invite() {
    const url = `${location.origin}/sala/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "BoxBet", text: `${host.nickname} te desafía en BoxBet. Sala ${code}`, url });
        return;
      } catch {
        return; // el usuario cerró la hoja de compartir: no es un error
      }
    }
    await copy("link");
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <Card className="relative overflow-hidden p-0 sm:p-0">
        <div className="h-1.5 bg-linear-to-r from-primary to-p1" />
        <div className="space-y-8 p-6 text-center sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-accent">
            <span className="size-2 animate-pulse rounded-full bg-primary" /> EN VIVO
          </span>
          <div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Esperando oponente…</h1>
            <p className="mt-2 text-muted">Comparte el código para desafiar a un amigo</p>
          </div>

          <Well className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:px-8">
            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold tracking-[0.25em] text-muted">CÓDIGO DE SALA</p>
              {/* Dígitos separados para el lector ("5 1 0 9", no "cinco mil ciento nueve").
                  aria-label en un <p> genérico no se anuncia: usamos texto sr-only + aria-hidden. */}
              <p className="font-mono text-5xl font-bold tracking-[0.3em]">
                <span aria-hidden>{code}</span>
                <span className="sr-only">{code.split("").join(" ")}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => copy("code")}>
                {copied === "code" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied === "code" ? "¡Copiado!" : "Copiar"}
              </Button>
              {/* Botón con texto visible: un icono solo es menos descubrible que una palabra. */}
              <Button variant="ghost" onClick={invite}>
                {copied === "link" ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
                {copied === "link" ? "Enlace copiado" : "Invitar"}
              </Button>
            </div>
            {/* Confirmación para lectores de pantalla (el cambio de texto del botón no siempre se anuncia). */}
            <p role="status" className="sr-only">
              {copied === "code" ? "Código copiado" : copied === "link" ? "Enlace de invitación copiado" : ""}
            </p>
          </Well>

          <div className="flex items-center justify-center gap-6 sm:gap-12">
            <figure className="space-y-2">
              <Avatar avatarId={host.avatarId} size="lg" className="mx-auto ring-4 ring-p1/40" />
              <figcaption className="font-semibold">{host.nickname}</figcaption>
            </figure>
            <span className="font-display text-4xl font-black text-white/15 italic">VS</span>
            <figure className="space-y-2">
              <div className="mx-auto grid size-24 place-items-center rounded-full border-2 border-dashed border-accent/50 bg-primary/5">
                <UserPlus className="size-9 text-accent/70" aria-hidden />
              </div>
              <figcaption className="text-muted italic">Esperando…</figcaption>
            </figure>
          </div>

          <p className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/10 bg-canvas-deep/60 px-5 py-2">
            <CoinIcon className="[--coin-size:1.75rem]" />
            <span className="text-left text-xs text-muted">
              APUESTA
              <strong className="block text-base text-white">{formatMoney(state.bet)}</strong>
            </span>
          </p>
        </div>
        <footer className="border-t border-white/5 p-4 text-center">
          <Button variant="ghost" onClick={onLeave} disabled={leaving}>
            <LogOut className="size-4" aria-hidden /> Cancelar y salir
          </Button>
        </footer>
      </Card>

      <p className="mx-auto w-fit rounded-full border border-white/10 bg-surface px-5 py-2 font-mono text-lg" aria-label="Tiempo esperando">
        {now === null ? "--:--" : formatDuration(now - state.createdAt)}
      </p>
      <p className="text-center text-sm text-muted">
        💡 <strong className="text-accent">Tip:</strong> evita trazar la tercera línea de una caja: le regalas la moneda a tu rival.
      </p>
    </div>
  );
}
