-- BoxBet · Esquema de salas
-- Modelo "documento": cada sala guarda el estado completo del juego en un JSONB.
-- El servidor (Next.js) es la AUTORIDAD: valida con el motor y escribe con la secret key.
-- Los navegadores solo LEEN y se suscriben a cambios (Realtime).

create table if not exists public.rooms (
  code        text primary key check (code ~ '^[0-9]{4}$'),
  state       jsonb not null,
  status      text not null check (status in ('waiting', 'playing', 'finished')),
  -- Control de concurrencia optimista: cada escritura exige la versión que leyó.
  version     integer not null default 0,
  host_id     uuid not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists rooms_updated_at_idx on public.rooms (updated_at);

-- Row Level Security: sin políticas de escritura, nadie escribe salvo la secret key (que ignora RLS).
alter table public.rooms enable row level security;

drop policy if exists "Las salas son públicas para lectura" on public.rooms;
create policy "Las salas son públicas para lectura"
  on public.rooms for select
  to anon, authenticated
  using (true);

-- Publicar la tabla en Realtime para que los clientes reciban INSERT/UPDATE/DELETE.
do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
end $$;
