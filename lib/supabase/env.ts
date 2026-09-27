// NEXT_PUBLIC_* se incrusta en el bundle del navegador (es público por diseño).
// Los secretos (SUPABASE_SECRET_KEY) se leen solo en lib/supabase/server.ts.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
