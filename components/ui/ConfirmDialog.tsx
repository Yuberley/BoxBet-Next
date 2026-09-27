"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo modal con el elemento NATIVO <dialog> + showModal(). El navegador ya resuelve:
 *   - foco atrapado dentro del diálogo y devuelto al botón que lo abrió al cerrar
 *   - tecla Esc para cancelar
 *   - resto de la página inerte (ni clic ni lector de pantalla) y fondo ::backdrop
 * Reemplaza a window.confirm(), que no se puede estilizar ni traducir y bloquea toda la página.
 */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Cancelar", onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Sincroniza la prop `open` con la API imperativa del <dialog>.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // "cancel" = tecla Esc: lo tratamos igual que el botón Cancelar.
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // Clic en el fondo (fuera de la caja) también cancela.
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      className="m-auto max-w-sm rounded-card border border-white/10 bg-surface p-0 text-slate-100 shadow-2xl backdrop:bg-canvas-deep/70 backdrop:backdrop-blur-sm"
    >
      <div className="space-y-4 p-6">
        <h2 id={titleId} className="font-display text-xl font-bold">
          {title}
        </h2>
        <p id={descriptionId} className="text-muted">
          {description}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          {/* autoFocus en la opción SEGURA: un Enter accidental no ejecuta la acción destructiva. */}
          <Button variant="ghost" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
