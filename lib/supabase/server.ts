import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createAdminClient, verifyCredentials } from "@supabase/server/core";
import { cookies } from "next/headers";
import type { SupabaseEnv } from "@supabase/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/*
 * Dos librerías, dos responsabilidades:
 *   @supabase/ssr    → sesión en cookies (leer, escribir, refrescar).
 *   @supabase/server → verificar el JWT y crear el cliente admin (secret key).
 * `import "server-only"` rompe el build si este archivo llega por error al navegador.
 */

/** Traduce las variables de Next al formato que espera @supabase/server. */
function serverEnv(): Partial<SupabaseEnv> {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  return {
    url: SUPABASE_URL,
    publishableKeys: { default: SUPABASE_PUBLISHABLE_KEY },
    secretKeys: secretKey ? { default: secretKey } : {},
    // Llaves públicas para verificar JWT; jose las descarga y las cachea.
    jwks: new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
  };
}

async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // En Server Components no se pueden escribir cookies; proxy.ts ya refrescó la sesión.
        }
      },
    },
  });
}

/**
 * Identidad del jugador. Devuelve el id VERIFICADO criptográficamente o `null`.
 * Con `create: true` (solo en Server Actions) crea un usuario anónimo si no existe.
 */
export async function getPlayerId({ create = false } = {}): Promise<string | null> {
  const supabase = await createSessionClient();
  let token = (await supabase.auth.getSession()).data.session?.access_token ?? null;

  if (!token && create) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(`No se pudo crear la sesión anónima: ${error.message}`);
    token = data.session?.access_token ?? null;
  }
  if (!token) return null;

  // getSession() solo LEE la cookie (podría estar manipulada): verificamos la firma del JWT.
  const { data, error } = await verifyCredentials({ token, apikey: null }, { auth: "user", env: serverEnv() });
  return error ? null : (data.userClaims?.id ?? null);
}

/** Cliente con la secret key: ignora RLS. Úsalo solo en código de servidor que ya validó permisos. */
export function createAdmin() {
  return createAdminClient({ env: serverEnv() });
}
