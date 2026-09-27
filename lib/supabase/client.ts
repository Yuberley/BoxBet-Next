import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** Cliente del navegador: solo lectura + Realtime. Lee la sesión desde las cookies. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    // El "latido" del WebSocket corre en un Web Worker: los navegadores frenan los timers
    // de las pestañas ocultas, pero no los de los workers, así la conexión no se cae.
    realtime: { worker: true },
  });
}
