# UX y accesibilidad en BoxBet

Guía de las decisiones de diseño de la app: **qué** hicimos, **por qué** y **dónde** está en el código.
Cada punto sigue un principio que sirve en cualquier framework o lenguaje.

> Resultado de la auditoría automática (axe-core 4.10, WCAG 2.2 AA + buenas prácticas):
> **0 violaciones** en inicio, reglas, modo local, mesa de juego, resultados y 404.

---

## 1. Percepción: que se vea y se entienda

### Contraste de color (WCAG 1.4.3 y 1.4.11)
El texto normal necesita **4.5:1** y los componentes de interfaz (bordes, líneas, iconos) **3:1**.
La auditoría inicial encontró tres fallos, y los corregimos separando los tokens por *función*:

| Uso | Antes | Después | Token |
|---|---|---|---|
| Texto blanco sobre botón | 3.68:1 ❌ | 5.17:1 ✅ | `--color-primary` (fondos) |
| Texto azul sobre tarjeta | 3.98:1 ❌ | 5.75:1 ✅ | `--color-accent` (texto, foco) |
| Línea libre del tablero | 1.63:1 ❌ | 4.18:1 ✅ | `--color-edge-free` |

📍 `app/globals.css` (`@theme`). **Lección:** nombra los tokens por lo que *hacen* (`primary`, `accent`),
no por cómo se ven (`blue-500`). Así puedes cambiar el valor sin romper su propósito.

### No depender solo del color (WCAG 1.4.1)
- Las celdas capturadas llevan una etiqueta **P1/P2**, además del color.
- El dado dice "TU DADO" o "DADO DE PROFE" en texto.
- Azul y naranja son un par distinguible con daltonismo común (deuteranopia y protanopia).

📍 `features/game/components/Board.tsx`, `DicePanel.tsx`

### Movimiento reducido (WCAG 2.3.3)
Quien configure su sistema con "reducir movimiento" ve las animaciones casi instantáneas.
📍 `@media (prefers-reduced-motion)` en `app/globals.css`

---

## 2. Visibilidad del estado del sistema (heurística #1 de Nielsen)

El usuario siempre debe saber **qué pasa, de quién es el turno y qué cambió**.

| Situación | Solución | Dónde |
|---|---|---|
| ¿Qué jugó el rival? | Sus líneas destellan 3 veces (`animate-edge-new`) | `Board.tsx`, `GameTable.tsx` → `recentKeys` |
| Estoy en otra pestaña | El título cambia a "🎲 ¡Tu turno! · …" | `hooks/useTurnAttention.ts` |
| No estoy mirando | Sonido corto al empezar mi turno | `hooks/useGameSounds.ts` |
| Esperando al servidor | El dado se agita; los botones dicen "Lanzando…" o "Entrando…" | `Dice.tsx`, `LobbyForm.tsx` |
| Queda poco tiempo | El reloj se pone rojo y parpadea a los 10 s | `TurnTimer.tsx` |
| El rival pidió revancha | Aviso destacado "Profe quiere la revancha. ¿Aceptas?" | `ResultView.tsx` → `notice` |

**Lección:** el motor guarda `lastTurn` (las líneas del turno anterior). La UI no tiene que
"adivinar" qué cambió; el dato viene del dominio, igual que el resaltado de la última jugada en ajedrez.

---

## 3. Operable con teclado (WCAG 2.1.1 y 2.4.7)

### Tablero con "roving tabindex"
Un tablero 5×5 tiene 60 líneas. Si fueran 60 paradas de Tab, jugar con teclado sería imposible.
- El tablero es **una sola parada de Tab** (solo una línea tiene `tabIndex=0`).
- **← →** recorren la fila; **↑ ↓** cambian de fila en zigzag; **Enter** o **Espacio** trazan.
- La lógica de navegación es una **función pura con pruebas**. La prueba "todas las líneas son
  alcanzables" encontró un fallo en la primera versión: 6 líneas quedaban aisladas.

📍 `components/board-navigation.ts` + `board-navigation.test.ts`

### `aria-disabled` en lugar de `disabled`
Un botón `disabled` no puede recibir el foco, y así el tablero quedaría "con huecos" para quien
usa teclado. Con `aria-disabled` la línea sigue siendo explorable y se anuncia "no disponible".

### Foco visible
El botón de cada línea es transparente, así que el anillo de foco se dibuja en la **línea**
(`group-focus-visible:ring-2`). Antes había un `outline-none` sin reemplazo: el foco era invisible.

### Gestión del foco: llevarlo al siguiente paso
| Momento | Problema | Solución |
|---|---|---|
| Pulsar LANZAR | El botón desaparece y el foco cae en `<body>` | El foco pasa al tablero |
| Empieza mi turno | El foco quedó en el tablero | El foco pasa a LANZAR |
| Un formulario falla | El usuario no sabe qué campo corregir | El foco va al campo con error |
| Cierro el diálogo | — | `<dialog>` devuelve el foco al botón que lo abrió |

**Regla:** mover el foco solo como respuesta a una acción del usuario. **Nunca al cargar la página.**
📍 `GameTable.tsx` (efecto de foco), `LobbyForm.tsx`, `TextField.tsx`

### Saltar al contenido (WCAG 2.4.1)
El primer Tab muestra "Saltar al contenido" y evita recorrer el menú en cada página.
📍 `app/layout.tsx`

---

## 4. Lectores de pantalla (WCAG 4.1.2 y 4.1.3)

- **Regiones vivas:** un `<p role="status" aria-live="polite">` anuncia, por ejemplo,
  "Es tu turno: lanza el dado" o "Profe capturó una moneda de 50 KB". El texto se **deriva del estado**
  (función pura, sin `useState`). 📍 `useTurnAttention.ts`
- **Etiquetas con contexto:** "Línea horizontal, fila 1, columna 3, de Profe, jugada recién".
  Cada moneda se lee como "Moneda de 50 KB, de Alumno".
- **Estructura:** cada vista tiene su `h1`; en la mesa es `sr-only` ("Partida en la sala 4056").
  Los `<aside>` tienen nombre único para poder saltar entre regiones.
- **Números que se leen bien:** el código "5109" se lee "5 1 0 9" y no "cinco mil ciento nueve"
  (texto `sr-only` + `aria-hidden`; `aria-label` en un `<p>` genérico **no** se anuncia).
- **Avisos (toast):** los errores usan `role="alert"` y lo informativo `role="status"`. Se cierran solos
  y tienen un botón de cierre. 📍 `components/ui/Toast.tsx`

---

## 5. Prevención y recuperación de errores (Nielsen #5 y #9)

- **El error va junto a su campo**, con `aria-invalid` y `aria-describedby`. El servidor devuelve
  `field: "nickname" | "code"` para saber qué marcar. 📍 `actions.ts`, `room.ts` (`FormState`)
- **El texto de ayuda se transforma en error**, así el espacio ya reservado evita saltos de layout.
- **Enter hace lo que el usuario espera:** en el código, une a la sala; antes creaba una
  (era el primer botón del formulario).
- **Confirmación de acciones destructivas** con `<dialog>` nativo en lugar de `confirm()`:
  - el foco inicial va en la opción segura ("Seguir jugando") y Esc cancela;
  - el fondo queda inerte;
  - el rojo se reserva solo para acciones destructivas.

  📍 `components/ui/ConfirmDialog.tsx`
- **Textos según quién mira:** "Tu rival abandonó" es falso para quien abandonó. El *microcopy* es una
  función pura con pruebas. 📍 `features/game/result-copy.ts`

---

## 6. Adaptarse al dispositivo

- **Mobile first:** en móvil, el dado queda justo debajo del tablero (`display: contents` + `order`).
- **Áreas táctiles grandes (ley de Fitts, WCAG 2.5.8):** la línea visible mide 6 px, pero su área
  de toque mide unos 30 px.
- **Web Share API:** en el celular, "Invitar" abre la hoja nativa (WhatsApp, etc.); en escritorio
  copia el enlace (mejora progresiva).
- **Formularios sin JavaScript:** las Server Actions funcionan aunque el JS no haya cargado.

---

## Cómo probarlo tú mismo

1. **Solo teclado:** desconecta el mouse y juega una partida local completa (Tab, flechas, Enter, Esc).
2. **Lector de pantalla:** NVDA (Windows, gratis) o VoiceOver (Mac: `Cmd + F5`).
3. **Auditoría automática:** DevTools → Lighthouse → Accessibility, o la extensión *axe DevTools*.
4. **Contraste:** DevTools → selecciona un texto y mira "Contrast ratio" en el panel de estilos.
5. **Movimiento reducido:** DevTools → Rendering → *Emulate CSS prefers-reduced-motion*.

> ⚠️ Las herramientas automáticas detectan cerca del 30–40 % de los problemas. El orden del foco,
> los textos confusos o un flujo que "pierde" al usuario solo se ven **probando con personas**.
