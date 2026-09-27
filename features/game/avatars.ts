// Avatares predefinidos: identidad visual sin pedir fotos ni datos personales.
export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  /** Clases de Tailwind para el fondo (deben escribirse completas para que Tailwind las detecte). */
  className: string;
}

export const AVATARS: Avatar[] = [
  { id: "fire", emoji: "🔥", name: "Fuego", className: "from-orange-500 to-orange-700" },
  { id: "rocket", emoji: "🚀", name: "Cohete", className: "from-blue-500 to-blue-700" },
  { id: "star", emoji: "⭐", name: "Estrella", className: "from-yellow-400 to-yellow-600" },
  { id: "crown", emoji: "👑", name: "Corona", className: "from-purple-500 to-purple-700" },
  { id: "diamond", emoji: "💎", name: "Diamante", className: "from-cyan-500 to-cyan-700" },
  { id: "lightning", emoji: "⚡", name: "Rayo", className: "from-amber-400 to-amber-600" },
  { id: "trophy", emoji: "🏆", name: "Trofeo", className: "from-lime-500 to-lime-700" },
  { id: "target", emoji: "🎯", name: "Diana", className: "from-red-500 to-red-700" },
  { id: "game", emoji: "🎮", name: "Gaming", className: "from-violet-500 to-violet-700" },
  { id: "dice", emoji: "🎲", name: "Dado", className: "from-pink-500 to-pink-700" },
  { id: "ninja", emoji: "🥷", name: "Ninja", className: "from-slate-500 to-slate-700" },
  { id: "alien", emoji: "👽", name: "Alien", className: "from-green-500 to-green-700" },
  { id: "robot", emoji: "🤖", name: "Robot", className: "from-teal-500 to-teal-700" },
];

export const getAvatar = (id: string) => AVATARS.find((a) => a.id === id) ?? AVATARS[0];

/** Elige un avatar al azar, evitando repetir el del rival. */
export function pickAvatar(exclude: string[] = [], random = Math.random): string {
  const options = AVATARS.filter((a) => !exclude.includes(a.id));
  return options[Math.floor(random() * options.length)].id;
}
