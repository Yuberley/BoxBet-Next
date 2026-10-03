# Hoja de ruta: recorrer BoxBet con lo aprendido

Para la sesión que sigue a **Next Fundamentos** (el proyecto de 10 lecciones). La meta no es entender cada
línea de BoxBet: es **reconocer** en un proyecto real lo que ya practicaron. Primero lo general, después un
ejemplo concreto. Duración sugerida: unos 90 minutos.

> El modo en línea (Supabase, tiempo real) se **nombra** al final, pero no se estudia hoy.

## 0. Preparación

```bash
npm install
npm run dev
```

`/local` y `/reglas` funcionan sin configurar Supabase: no se necesita nada más para esta clase.

## 1. Jugar primero (10 min)

- Dos estudiantes juegan una partida en http://localhost:3000/local y el resto observa.
- Leer `/reglas` en voz alta.
- Pregunta al grupo: **¿qué cambia en la pantalla cuando alguien juega?** (turno, dado, líneas, puntaje).
  Todo eso es **estado** (lecciones 6 y 7).

## 2. El mapa (10 min)

```
app/                        las páginas (URLs)
 └─ usan → components/ui/                  piezas reutilizables: Button, Card, TextField
 └─ usan → features/game/components/       piezas del juego: Board, DicePanel, PlayerCard…
                └─ le preguntan a → features/game/engine/   las reglas del juego, sin React
```

| Carpeta | Qué hay | ¿Hoy? |
|---|---|---|
| `app/` | Las páginas: `/`, `/local`, `/reglas`, `/sala/[code]` | ✅ |
| `components/ui/` | Botones, tarjetas y campos reutilizables | ✅ |
| `features/game/components/` | Tablero, dado, tarjetas de jugador, resultados | ✅ |
| `features/game/engine/` | Reglas en TypeScript puro, con pruebas | 👀 un vistazo |
| `features/game/actions.ts` y `server/`, `lib/supabase/`, `proxy.ts` | Modo en línea | ⏭️ después |

**Idea clave:** React **dibuja** y el motor **decide**. La interfaz nunca calcula quién gana: le pregunta a
`engine/`.

## 3. Lo que ya conocen, dentro de BoxBet (15 min)

Abrir cada archivo y señalar solo las líneas indicadas.

| Lección | En BoxBet | Qué señalar |
|---|---|---|
| 1 · Maquetación | `app/layout.tsx` | `<Header />`, `{children}` y `metadata` con `"%s · BoxBet"` |
| 2 · Componentes y props | `components/ui/Card.tsx`, `features/game/components/PlayerCard.tsx` | `Card` recibe `children`; `PlayerCard` recibe `player`, `money`, `isTurn`… |
| 3 · Estilos | `app/globals.css`, `components/ui/Button.tsx` | Tokens en `@theme` (`--color-p1`); variantes como las de `Boton` |
| 4 · Responsive | `components/layout/Header.tsx`, `features/game/components/GameTable.tsx` | `sm:hidden` / `hidden sm:inline`; `lg:grid-cols-[20rem_1fr_20rem]` |
| 5 · Navegación | `app/sala/[code]/page.tsx`, `app/not-found.tsx` | `[code]` funciona como `[planeta]`: `await params` y `notFound()` |
| 6 · Interacción | `components/sound/SoundToggle.tsx`, `features/game/components/BetPicker.tsx` | `"use client"`, `onClick`, `useState` |
| 7 · Estado | `features/game/local/LocalGame.tsx` | `useReducer`, igual que `Dados` |
| 8 · Hooks | `features/game/hooks/useTurnAttention.ts`, `components/ui/TextField.tsx` | `useEffect` que pone «🎲 ¡Tu turno!» en la pestaña (modo en línea) y lo limpia después; `useRef` + `focus()` |
| 9 · Servidor y cliente | `app/local/page.tsx`, `app/sala/[code]/loading.tsx`, `app/error.tsx` | Una página de servidor que dibuja un componente de cliente; `loading.tsx`; `error.tsx` |
| 10 · Formularios | `features/game/actions.ts`, `features/game/components/LobbyForm.tsx` | `"use server"`, errores `{ error, field }`, `useActionState`, `redirect()` |

Dos diferencias que pueden notar: BoxBet tipa las páginas con `PageProps<"/sala/[code]">`, un tipo que genera
Next (en Next Fundamentos lo escribimos a mano), y su `error.tsx` usa `reset()`, que reintenta sin volver a
pedir datos al servidor; desde Next 16.2 se recomienda `retry()`, como en la lección 9.

## 4. Ejemplo guiado: el modo local, de la URL al clic (25 min)

Dos jugadores en un mismo dispositivo: sin red ni base de datos. Es el mejor camino para empezar.

**Paso 1 · La URL → la página** (lecciones 1 y 9). `/local` corresponde a `app/local/page.tsx`: 9 líneas. Es un
Server Component que solo define `metadata` y dibuja `<LocalGame />`. La interactividad vive en otro archivo.

**Paso 2 · Un componente de cliente con tres pantallas** (lecciones 6 y 7). `features/game/local/LocalGame.tsx`
lleva `"use client"` y guarda la partida con `useReducer(reducer, null)`. Según el estado, dibuja una pantalla:

| Estado | Pantalla |
|---|---|
| `null` | Formulario: nombres y apuesta |
| `status: "playing"` | `<GameTable />`, la mesa |
| `status: "finished"` | `<ResultView />`, los resultados |

Es el mismo patrón de `Dados` (lección 7): acciones con nombre (`start`, `roll`, `place`, `reset`) y un
reducer **puro**. Por eso la semilla del azar (`seed`) y la hora (`now`) viajan dentro de la acción.

**Paso 3 · El formulario** (lecciones 2, 6 y 7).
- `<form action={(formData) => dispatch(…)}>`: aquí el `action` es una función del navegador, no una Server
  Action, pero lee los campos por su `name` igual que en la lección 10.
- `TextField` es un componente con props (`label`, `name`…).
- `BetPicker` usa `useState` para la apuesta y **calcula** el tamaño del tablero (`gridSize`), sin guardarlo.

**Paso 4 · La mesa recibe datos y funciones** (lección 7, «subir el estado»). `GameTable` no guarda la partida:
la recibe por props (`state`) junto con funciones (`onRoll`, `onPlaceEdge`). Es el `Marcador` de la lección 7
en grande.

**Paso 5 · Un clic, de principio a fin.** Pedir a un estudiante que lo recorra en voz alta, archivo por archivo:

```
Clic en una línea                      features/game/components/Board.tsx
  → onPlaceEdge(edge)                  una prop que llegó desde LocalGame
  → dispatch({ type: "place", … })     features/game/local/LocalGame.tsx
  → reducer → placeEdge(…)             features/game/engine/game.ts: estado viejo → estado nuevo
  → React vuelve a dibujar GameTable, Board y PlayerCard con el estado nuevo
```

## 5. Lo que viene después (5 min, solo nombrar)

El modo en línea reutiliza la **misma mesa y el mismo motor**; cambia dónde vive el estado:

- **Server Actions** que validan, guardan y redirigen: `features/game/actions.ts`.
- **Base de datos y tiempo real** con Supabase: `features/game/server/rooms.ts` y
  `features/game/hooks/useRoomChannel.ts`.
- **UI optimista** con `useOptimistic`: la línea aparece antes de que responda el servidor
  (`features/game/components/RoomClient.tsx`).
- Para ver cómo creció el proyecto: `git checkout fase-4-local` (solo modo local). Para volver:
  `git checkout master`.

Para profundizar en las decisiones de diseño: [UX y accesibilidad](UX-ACCESIBILIDAD.md).

## Ejercicios para casa

1. **Una apuesta nueva** (fácil). Agrega `200` a `BET_OPTIONS`, entre 100 y 500, en
   `features/game/engine/constants.ts`. Aparece en el selector y en `/reglas` sin tocar esas páginas: ¿por qué?
   ¿Y por qué el selector quedó en dos filas?
2. **Otro color** (fácil). Cambia `--color-p1` en `app/globals.css` y juega una partida local.
3. **Una regla más** (fácil). Agrega un paso al arreglo `steps` de `app/reglas/page.tsx`.
4. **Terminar partida** (intermedio). En `LocalGame.tsx`, pásale a `GameTable` la prop `actions` con un
   `<Button variant="ghost">` que haga `dispatch({ type: "reset" })`. Pista: `RoomClient.tsx` ya hace algo
   parecido con «Abandonar partida».
