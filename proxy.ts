import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/*
 * Proxy (antes "middleware" en Next ≤ 15): corre ANTES de cada request.
 * Aquí solo refresca el token de sesión de Supabase y reescribe las cookies,
 * porque los Server Components no pueden escribir cookies.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Sin credenciales (p. ej. recién clonado) la app sigue funcionando en modo local.
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Dispara la rotación del refresh token si el access token expiró.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // No correr en assets estáticos: menos latencia y menos llamadas a Supabase.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
