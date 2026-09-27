// Efectos de sonido sintetizados con Web Audio API: sin archivos de audio que descargar.

export type SoundName = "start" | "turn" | "dice" | "edge" | "capture" | "win" | "lose";

// Cada sonido es una lista de notas: [frecuencia Hz, retraso s, duración s, volumen].
const SOUNDS: Record<SoundName, Array<[number, number, number, number]>> = {
  start: [[523.25, 0, 0.4, 0.08], [659.25, 0, 0.4, 0.06], [783.99, 0, 0.4, 0.05]],
  turn: [[659.25, 0, 0.12, 0.06], [880, 0.12, 0.18, 0.07]],
  dice: [[392, 0, 0.08, 0.05], [523.25, 0.04, 0.08, 0.04]],
  edge: [[880, 0, 0.06, 0.03]],
  capture: [[1046.5, 0, 0.25, 0.09], [1318.51, 0, 0.22, 0.07], [2093, 0.03, 0.15, 0.04]],
  win: [[523.25, 0, 0.2, 0.08], [659.25, 0.15, 0.2, 0.08], [783.99, 0.3, 0.2, 0.08], [1046.5, 0.45, 0.5, 0.09]],
  lose: [[392, 0, 0.4, 0.08], [329.63, 0.25, 0.4, 0.08], [261.63, 0.5, 0.5, 0.08]],
};

let context: AudioContext | null = null;

export function playSound(name: SoundName) {
  if (typeof window === "undefined") return;
  context ??= new AudioContext();
  const now = context.currentTime;

  for (const [frequency, delay, duration, volume] of SOUNDS[name]) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain).connect(context.destination);

    // Envolvente: sube rápido y se apaga suave (evita "clics" en el audio).
    const start = now + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }
}
