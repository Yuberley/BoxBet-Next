# BoxBet · Next.js

Juego de "cerrar cajas" por turnos para 2 jugadores: lanzas un dado, trazas líneas y, si cierras una celda, ganas su moneda.
Proyecto de clase: **el objetivo es entender los conceptos**, no memorizar la sintaxis de un framework.
¿Empiezas con React y Next? Sigue el recorrido guiado: 📘 [`docs/HOJA-DE-RUTA.md`](docs/HOJA-DE-RUTA.md).

## Instalar en otro computador

Requisitos: **Node.js 20.9 o superior** (recomendado 24, ver `.nvmrc`) y Git.

```bash
git clone https://github.com/Yuberley/BoxBet-Next.git
cd BoxBet-Next
npm ci                       # instala exactamente las versiones de package-lock.json
```

Luego copia tu archivo **`.env.local`** en la raíz del proyecto (no está en GitHub: tiene la clave secreta).
Sin ese archivo, `/local` y `/reglas` funcionan igual; solo el modo en línea lo necesita.

```bash
npm run dev                  # http://localhost:3000
```

**Jugar desde el celular** (misma red Wi-Fi): agrega a `.env.local` la línea `DEV_ORIGINS=<IP-del-PC>`
(la ves con `ipconfig`), ejecuta `npm run dev -- -H 0.0.0.0` y abre `http://<IP-del-PC>:3000` en el celular.

## Arrancar

```bash
npm install
cp .env.example .env.local   # completa las 3 variables
npm run dev                  # http://localhost:3000
npm test                     # pruebas del motor
```

Sin variables de Supabase funcionan igual `/local` (dos jugadores, un dispositivo) y `/reglas`.

### Supabase (una sola vez)
1. **SQL Editor** → ejecuta [`supabase/migrations/20260927000000_rooms.sql`](supabase/migrations/20260927000000_rooms.sql).
2. **Authentication → Sign In / Providers** → activa **Anonymous sign-ins**.
3. **Project Settings → API Keys** → copia la publishable key y la secret key en `.env.local`.

### Vercel
Importa el repo, define las mismas 3 variables en *Settings → Environment Variables* y despliega.

## Arquitectura en una imagen

```
Navegador                         Next.js (Vercel)                    Supabase
─────────                         ────────────────                    ────────
RoomClient ── Server Action ──▶  actions.ts ─▶ motor puro ─▶ rooms.ts ─▶ Postgres (rooms)
    ▲                            (valida y decide)                          │
    └──────────────── Realtime (postgres_changes) ◀─────────────────────────┘
```

| Pregunta | Respuesta | Dónde |
|---|---|---|
| ¿Quién **decide** si una jugada vale? | El servidor, con el motor puro | `features/game/actions.ts` |
| ¿Quién **recuerda** el estado? | Postgres (un JSONB por sala) | `features/game/server/rooms.ts` |
| ¿Cómo se **entera** el rival? | Supabase Realtime | `features/game/hooks/useRoomChannel.ts` |
| ¿Quién **es** cada jugador? | Usuario anónimo de Supabase (JWT verificado) | `lib/supabase/server.ts` |

## Mapa de conceptos → código

| Concepto | Archivo |
|---|---|
| Lógica de negocio independiente del framework (funciones puras) | `features/game/engine/game.ts` |
| Pruebas unitarias e inyección de dependencias (`now`, `random`) | `features/game/engine/engine.test.ts` |
| Programación dinámica (reparto exacto de monedas) | `features/game/engine/coins.ts` |
| Estado derivado (el puntaje se calcula, no se guarda) | `getScores` en `game.ts` |
| Evaluación perezosa del tiempo (sin procesos en segundo plano) | `resolveTimeouts` en `game.ts` |
| Concurrencia optimista (compare-and-swap con `version`) | `mutateRoom` en `rooms.ts` |
| Patrón adaptador: mismo motor, dos "backends" | `local/LocalGame.tsx` (useReducer) vs `components/RoomClient.tsx` (red) |
| Server vs Client Components | `app/sala/[code]/page.tsx` vs `RoomClient.tsx` |
| UI optimista (`useOptimistic`) | `RoomClient.tsx` |
| Estado externo a React (`useSyncExternalStore`) | `hooks/useNow.ts`, `components/sound/sound-preference.ts` |
| Design tokens (una fuente de verdad visual) | `app/globals.css` (`@theme`) |
| Accesibilidad y UX (contraste, teclado, foco, lectores de pantalla) | 📘 [`docs/UX-ACCESIBILIDAD.md`](docs/UX-ACCESIBILIDAD.md) |

## Estructura

```
app/                      rutas (cada carpeta = una URL)
  page.tsx                inicio: crear / unirse
  sala/[code]/            sala de espera, mesa y resultados
  local/  reglas/
features/game/
  engine/                 ⭐ reglas del juego (TypeScript puro + tests)
  server/rooms.ts         acceso a la base de datos
  actions.ts              Server Actions
  components/  hooks/  local/
components/ui/            piezas de interfaz reutilizables
lib/supabase/             clientes de Supabase (navegador, servidor, proxy)
proxy.ts                  refresca la sesión en cada request (antes "middleware")
```

## Historia del proyecto

Cada fase quedó como un tag de git para recorrer la evolución en clase: `git checkout fase-2-motor`.
