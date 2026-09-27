import type { CSSProperties } from "react";

// Posición de los puntos en una cuadrícula 3×3 (índices 0–8) para cada cara.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Rotación del cubo para dejar cada cara al frente (orden de las caras en globals.css).
const FACE_ROTATION: Record<number, [x: number, y: number]> = {
  1: [0, 0],
  2: [0, -90],
  3: [0, -180],
  4: [0, 90],
  5: [-90, 0],
  6: [90, 0],
};

/**
 * Dado 3D hecho solo con CSS. Para relanzar la animación, el padre cambia la `key`
 * del componente: React lo monta de nuevo y la animación CSS arranca desde cero.
 */
export function Dice({ value, size = "4.5rem" }: { value: number | null; size?: string }) {
  const [x, y] = FACE_ROTATION[value ?? 1];
  const style: CSSProperties = {
    // Dos vueltas completas antes de caer en la cara final.
    transform: value ? `rotateX(${x + 720}deg) rotateY(${y + 720}deg)` : "rotateX(-20deg) rotateY(25deg)",
  };

  return (
    <div
      className="dice-scene"
      style={{ "--dice-size": size } as CSSProperties}
      role="img"
      aria-label={value ? `Dado: ${value}` : "Dado sin lanzar"}
    >
      <div className={value ? "dice dice-rolling" : "dice"} style={style}>
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <div key={face} className="dice-face">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={PIPS[face].includes(i) ? "dice-dot" : undefined} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
