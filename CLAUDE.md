# Docenza — Planificador Digital para Docentes

PWA offline-first para que docentes lleven su cuaderno de planificación en digital:
**horarios**, **calendario / planificación semanal**, **reuniones** (con firmas), **notas**
(editor rico). Edición, exportación a PDF, backup JSON, cuentas con sincronización
multi-dispositivo y suscripción anual, y un asistente de IA.

En producción y en pruebas con docentes reales: **https://docenza.app**

> El historial detallado de cada cambio está en el log de git. Este archivo es solo
> referencia viva + lecciones que no conviene volver a aprender a golpes.

---

## Estado

Todas las fases funcionales (1–9) están hechas, verificadas y desplegadas. Deploy
automático a `docenza.app` (GitHub Pages) al hacer push a `main`.

### Pendiente / abierto

- **Documentos legales** — `PoliticaPrivacidad.tsx` / `TerminosUso.tsx` son borrador:
  faltan **NIF/CIF** y **domicilio social**, y sobre todo la **revisión de un profesional
  legal**. Único bloqueante real para un lanzamiento comercial. No es código (la coherencia
  texto ↔ app real ya se revisó; declaran los encargados de tratamiento reales: Supabase,
  Stripe, Resend, Groq, Google).
- **Testing** — sin CI (las suites se corren a mano), solo Chromium, sin Chromatic
  (regresión visual), sin tests de componentes React (`@testing-library/react`). El
  testing manual en dispositivos reales sigue siendo necesario para instalación PWA y
  gestos táctiles.
- **Apple Sign-In** — descartado por coste (cuenta de pago Apple Developer + verificación
  de dominio). Google sí está.
- **Renombrados internos** (cada uno rompe algo — no tocar sin decisión explícita):
  - IndexedDB `PlafinicadorDB` → renombrar exige una **migración explícita** (abrir la DB
    vieja, copiar todo a una nueva, y solo entonces borrar la vieja) para no perder los
    datos de las docentes que ya están probando la app.
  - El repo de GitHub y la URL de GitHub Pages siguen en `planificador-docente` (el
    dominio real ya es `docenza.app`). Cambiarlos rompe cualquier enlace ya compartido.
- **Backlog de exportación** (nunca pedido): CSS `@media print` para pantalla,
  cabeceras/pies configurables, marca de agua en el PDF.
- **Ficha de alumnado / evaluación individual** — **DESCARTADA por el usuario**
  (28-08-2026). Si se reconsidera: alcance acordado era Nivel 1+2 (identificación básica +
  seguimiento pedagógico, sin datos del Art. 9 RGPD) + seudonimización (id interno + alias,
  nombre real local-only sin sincronizar).
- **Onboarding guiado paso a paso**, vídeo demo, documentación de usuario final (existe la
  Guía de Ayuda in-app, no un onboarding).

---

## Stack

- **Front:** React 18 + Vite + TypeScript + TailwindCSS. **Zustand** (estado),
  **Dexie/IndexedDB** (local), **shadcn/ui** sobre Radix (componentes).
- **Calendario:** react-big-calendar + **date-fns** (curso escolar septiembre–agosto).
- **Editor de notas:** Tiptap. **PDF:** `@react-pdf/renderer` (`utils/pdf.tsx`,
  `utils/pdfTemplates.tsx`). **PWA:** vite-plugin-pwa + Workbox.
- **Backend:** **Supabase** (Postgres + Auth + RLS + Edge Functions en Deno).
  **Stripe** (suscripción anual **29,99 €**). **Resend** (emails de Auth desde
  `noreply@docenza.app`). **Groq** (asistente de IA).
- **Hosting:** GitHub Pages + dominio propio `docenza.app` (`public/CNAME`). El workflow
  (`.github/workflows/deploy.yml`) pasa `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` como
  secrets del repo (el `.env` local no llega a CI).
- **Tests:** Playwright E2E (`e2e/*.spec.ts`, `npm run test:e2e`) + Vitest unitario
  (`src/**/*.test.ts`, `npm run test:unit`). Config de Vitest en un bloque `test` dentro
  de `vite.config.ts`.

---

## Arquitectura

### Local-first con sync opcional
Todo se guarda en IndexedDB (Dexie, DB **`PlafinicadorDB`**). Con una cuenta iniciada,
cada mutación sincroniza en segundo plano a Supabase (`src/sync/`), sin bloquear la UI —
principio **"mejor esfuerzo, nunca bloqueante"**: un fallo de red no debe romper ni
alarmar (offline es un estado esperado). Los cuadernos en Dexie llevan `userId` para no
mezclar cuentas en el mismo navegador.

La **fusión entre dispositivos** es por elemento (`src/sync/mergeCuaderno.ts`): gana el
`actualizado` más reciente de cada horario/semana/reunión/nota/evento; `metadata` y
`configuracion` se resuelven como bloque entero. Los **tombstones**
(`CuadernoDocente.eliminados: Eliminacion[]`) evitan que un elemento borrado en un
dispositivo resucite al fusionar con la copia (más antigua) de otro.

### Modelo de datos (`src/types/index.ts`)
`CuadernoDocente` = `{ metadata, configuracion, horarios[], planificacion.semanal[],
reuniones[], notas[], eventos[], eliminados[] }`.
- `Horario`: `configHorarios` (nº periodos, hora inicio, duración, recreo) +
  `datos: CeldaHorario[][]` (`[periodo][día]`) + `fechaInicio`/`fechaFin` opcionales
  (rango de vigencia flexible: una semana o un trimestre entero).
- `CeldaHorario`: `contenido` (asignatura), `nota`, `color` (id de `PALETA_ASIGNATURAS`).
- `configuracion.festivos: Festivo[]` (`tipo: nacional | autonomico | local`,
  `origen: automatico | manual`) y `.vacaciones: Vacacion[]`.
- `Evento` (agenda estilo Google Calendar): opcional `recurrencia: { frecuencia, hasta }`
  — las ocurrencias se calculan al vuelo (`utils/recurrencia.ts`), no se guardan.
  Editar/borrar un evento recurrente afecta a toda la serie.

### Horarios: navegación y festivos
`HorarioManager.tsx` navega en 3 niveles (meses → semanas → semana), con breadcrumb.
Los horarios sin fecha (o con fecha fuera del curso escolar) aparecen en "sin periodo
asignado". Un horario que abarca más que la semana vista dispara la pregunta de alcance
al guardar/borrar ("todo el periodo" / "solo esta semana"; `dividirHorarioParaSemana`).
En días festivos/vacaciones la celda no se puede editar (mismo criterio en Horarios,
Planificar y el exportador del asistente).

### Planificación ↔ Horario: fuente única
Cuando hay un horario vigente en la semana de una `Semana`, el Planificador
(`SemanaEditor` / `VistaSemanal`) **lee y escribe directamente en las celdas de ese
horario** — no guarda copia propia. La celda se edita con el mismo formulario que en
Horarios (`CeldaHorarioForm.tsx`, compartido). Si no hay horario vigente, al guardar se
crea uno nuevo scoped a esa semana. `Semana.dias[].periodos[].contenido` se mantiene solo
como "espejo" para el PDF y el contexto del asistente.
`horarioVigenteDeSemana()` (`utils/horarios.ts`) elige de forma determinista cuando
varios horarios cubren la semana: **docente > alumnado → rango más amplio > semana suelta
→ `actualizado` más reciente**. (`HorarioSemanaDialog` y `PasoExportarHorario` NO lo usan:
ahí, con varios, se ofrece un selector explícito.)

### Festivos oficiales (`src/types/festivosOficiales.ts`)
Datos verificados por web (BOE/Wikipedia), no de memoria: 9 nacionales de fecha fija +
Viernes Santo precalculado para los cursos 2024-25 a 2028-29 + el festivo autonómico de
las 17 CCAA + Ceuta y Melilla. **País Vasco no tiene festivo autonómico oficial** (se
derogó en 2013) — es a propósito, no un hueco. Los nacionales se cargan al crear un
cuaderno; el autonómico según la comunidad del perfil; los locales, a mano.

### Auth y pago (Supabase + Stripe)
Plan de arquitectura: `C:\Users\Deligober\.claude\plans\lucky-noodling-petal.md`.

- **Cliente Supabase compuesto a mano** (`src/lib/supabaseClient.ts`): `AuthClient` +
  `PostgrestClient` + `FunctionsClient`, **NO `createClient()`** (se podaron Storage y
  Realtime, que la app no usa, para adelgazar el bundle ~29% gzip). La persistencia de
  sesión (`persistSession`, `autoRefreshToken`, clave de `localStorage`
  `sb-<primer-segmento-del-host>-auth-token`, `flowType: 'implicit'`) y `fetchWithAuth`
  son **código propio replicado del fuente de la librería** → cualquier cambio ahí tiene
  riesgo real de desconectar sesiones o romper el OAuth de Google.
- `useAuthStore` suscribe `onAuthStateChange` en el cuerpo del `create<>()` (al importar
  el módulo), no dentro de un `useEffect`, para no perder el evento `PASSWORD_RECOVERY`.
- **`profiles.has_paid` es columna generada:** `subscription_status in
  ('active','trialing') OR manual_premium`. **Nunca escribirla directamente**; el webhook
  solo toca `subscription_status` / `cancel_at_period_end`.
- **Tope de prueba gratuita: 1 elemento por módulo** (`src/constants/trial.ts` + trigger
  `enforce_trial_limits` en Postgres, que es la aplicación real; el guard en cliente es
  solo UX). Si al sincronizar el cuaderno supera el tope (típico tras fusionar dos
  dispositivos), el trigger rechaza la subida y `SyncTopeBanner` avisa.
- **Edge Functions** (`supabase/functions/`, Deno — runtime aparte, no cubierto por el
  `tsconfig` de `src/`):
  - `create-checkout-session` y `stripe-webhook` se desplegaron "Via Editor" del panel y
    Supabase les puso **slugs aleatorios**: el checkout se invoca como **`smart-worker`**
    y la URL del webhook en Stripe es **`.../rapid-handler`**. El resto (`ai-assistant`,
    `delete-account`, `create-portal-session`, `admin-api`) se desplegaron por CLI y
    respetan el nombre de la carpeta.
  - **TODAS necesitan "Enforce JWT Verification" DESACTIVADA** (`--no-verify-jwt` en el
    deploy por CLI): el preflight CORS y los webhooks de Stripe no llevan JWT. La
    verificación real la hace el código (JWT del usuario / firma de Stripe / `is_admin`).
- **Migraciones:** 0001–0002 se aplicaron a mano por el panel; 0003+ con
  `npx supabase db query --linked --file supabase/migrations/XXXX.sql`. **No usar
  `db push`** (intenta reaplicar las que no están en el historial de la CLI).
- **Stripe LIVE:** clave restringida `rk_live_...` (escritura en Customers / Checkout
  Sessions / Subscriptions / Billing Portal Sessions), **compartida con otros dos
  productos de Appstracta** — no rotarla a la ligera.
- El webhook lee `current_period_end` con fallback a
  `subscription.items.data[0].current_period_end` (cambió de sitio entre versiones de API
  de Stripe: el objeto del evento usa la versión de la cuenta, `retrieve()` la del código).
- **Baja de autoservicio:** `MiSuscripcionDialog` → Portal de Facturación de Stripe
  (cancelación al final del periodo). Borrado de cuenta: `EliminarCuentaDialog` (escribir
  "ELIMINAR") → `delete-account` cancela Stripe y borra el usuario (cascada a `profiles` y
  `cuadernos`); si la cancelación de Stripe falla por un motivo real, **aborta sin borrar**.

### Asistente de IA
`AsistenteChat.tsx` (botón flotante) → Edge Function `ai-assistant` → Groq. Solo con
suscripción activa. Prompt propio por módulo (Horarios/Calendario/Reuniones/Notas).
Historial por cuenta+módulo en `localStorage` (`utils/asistenteHistorial.ts`). Límite
**30 mensajes/día por cuenta** (tabla `ai_usage_daily` + función atómica
`increment_ai_usage`, migración 0003). Contexto opcional: "incluir lo último que has
editado" (`useEditorContextStore`, alimentado por `NotaEditor`/`SemanaEditor`). Cada
respuesta se puede exportar a Horario / Nota / Reunión (`ExportarRespuestaDialog`).

### Admin
`profiles.is_admin` (se marca con `update profiles set is_admin = true where email = ...`
en SQL; un usuario no puede auto-asignárselo — no hay policy de escritura). Icono en
`AppHeader` solo si `isAdmin` → `AdminPanel` (perezoso, `createPortal` a `document.body`
para escapar del `backdrop-blur` del header). Función `admin-api` enruta por
`body.action` (stats, list_users, user_detail, set_manual_premium, cancel_subscription,
delete_user), con `admin_audit_log`.

### Botón atrás físico de Android
Pila global compartida (`src/hooks/backNavigationStack.ts`) + `useHistoryBack.ts`. El
`Dialog` raíz (`ui/dialog.tsx`) y `HorarioManager` (navegación por niveles) apilan
entradas; el `popstate` las resuelve. La profundidad real se lee de `history.state`
(`{ __appDepth: N }`), no de un contador manual (Chrome colapsa varios `popstate` en uno).

---

## Estructura

```
src/
  components/  ui/ layout/ horario/ calendario/ reuniones/ notas/ export/ ai/
               auth/ admin/ perfil/ legal/ paywall/ suscripcion/ ayuda/
  stores/      useCuadernoStore  useAuthStore  useSyncStatusStore  useEditorContextStore
  sync/        syncCuaderno  mergeCuaderno  deleteAccount
  lib/         supabaseClient  adminApi
  hooks/       useHistoryBack  backNavigationStack  useRecordatoriosEventos
               useCheckoutReturn  useTheme
  utils/       fechas  festivos  horarios  recurrencia  recordatorios  perfil
               pdf(.tsx)  pdfTemplates(.tsx)  export  texto  asistenteHistorial  cn
  types/       index  constants  festivosOficiales
supabase/
  migrations/  0001_init … 0005_admin   (aplicar con `db query --linked --file`)
  functions/   create-checkout-session(=smart-worker)  stripe-webhook(=rapid-handler)
               ai-assistant  delete-account  create-portal-session  admin-api
e2e/           *.spec.ts  fixtures.ts  testUser.ts  helpers.ts  supabaseAdmin.ts
```

## Comandos

```
npm run dev            # SIN Service Worker (PWA solo en build)
npm run build          # incluye tsc
npm run preview
npm run test:e2e       # Playwright (build+preview real, cuentas Supabase efímeras)
npm run test:unit      # Vitest
npm run lint
```

Tests E2E: cada uno crea su cuenta Supabase efímera vía Admin API (`e2e/testUser.ts`,
`fixtures.ts`) y la borra al terminar. `testUser` viene con suscripción activa;
`testUserTrial`, sin ella (para probar el tope de prueba).

---

## Gotchas / lecciones

- **Fechas de `<input type="date">`:** usar `parseFechaInput()` (`utils/fechas.ts`),
  NUNCA `new Date("yyyy-MM-dd")` (se interpreta como medianoche **UTC** → desajuste de
  1–2 h en `Europe/Madrid`, rompía comparaciones de "coincide con esta semana"). Vale
  también en los tests: construir fechas con `new Date(año, mes-1, día)`.
- **Copiar credenciales a mano pierde caracteres.** Ha pasado 4+ veces
  (`STRIPE_WEBHOOK_SECRET`, token de Resend, Client ID de Google, clave estándar de
  Stripe). Ante cualquier `invalid client` / `invalid secret` / `invalid username` /
  `whitespace in secret` de un servicio externo, sospechar **primero** de un copy-paste
  incompleto. Usar el botón de copiar del servicio, no seleccionar el texto.
- **Depurar email (Resend) y OAuth (Google):** Supabase → **Logs → Auth Logs** (no los
  Postgres Logs, que no muestran nada del envío de email ni del callback de OAuth).
  Stripe: mirar los **logs de Supabase de la función**, no solo el estado en Stripe (un
  200 en Stripe puede esconder un fallo dentro de la función).
- **`<Document>` de `@react-pdf/renderer` no se anida.** `CuadernoCompletoPDF` compone
  cada `X…PDFPage` (contenido sin `<Document>` propio), nunca `X…PDFDocument`. Si el PDF
  completo falla en una sección, es esto.
- **Tiptap descarta imágenes `data:` URL** salvo `Image.configure({ allowBase64: true })`
  (ya puesto). Sin eso, abrir para editar una nota con imagen la borraba en silencio.
- **`vite-plugin-pwa` no corre en `npm run dev`** — el SW / la PWA solo se prueban con
  `build && preview` (por eso el `webServer` de Playwright hace eso).
- **Assets de `public/`:** revisar de vez en cuando que no sean placeholders. Los iconos
  PWA fueron archivos de 5 bytes ("dummy") durante meses (rompía la instalación en
  Android) sin que ningún test lo detectara.
- **Modelo de Groq:** `openai/gpt-oss-120b` (`supabase/functions/ai-assistant/index.ts`).
  Groq retira modelos gratuitos cada pocos meses (pasó con `llama-3.3-70b-versatile`).
  Ante "no se ha podido contactar con el asistente", comprobar deprecaciones de Groq.
- **`React.lazy` + offline:** un chunk que nunca se descargó no carga sin red y el
  `Suspense` se cuelga para siempre. En tests, visitar la sección antes de cortar la red.
- **react-big-calendar:** necesita `culture="es"` explícito (además del `localizer`), o
  la semana empieza en domingo. Las vistas Semana/Día están quitadas a propósito
  (`views={['month','agenda']}`) — nunca se estilaron. Un evento "de todo el día" debe
  terminar en `endOfDay(fecha)`, no en la medianoche del día siguiente (si no ocupa 2
  celdas). Los toques en la cuadrícula van por `CeldaDiaClicable`/`CabeceraDiaClicable`,
  no por `onSelectSlot` (que en táctil exige mantener pulsado).
- **Modo claro/oscuro:** toggle en el header, `useTheme`, `localStorage`. No se sincroniza
  entre dispositivos a propósito (preferencia local, igual que el historial del asistente).
- **Modales (`ui/dialog.tsx`):** pulsar fuera del modal NO cierra (una docente perdió una
  reunión casi acabada por un toque accidental). El aspa y Escape pasan por `requestClose`
  → si un formulario registró un guardián con `useDialogCloseGuard(hayCambios)`, pide
  confirmación. El botón atrás de Android cierra directo (sin guardián: rebobinar la pila
  de historial es justo lo delicado que avisa este archivo). En los formularios de
  Reunión / Nota / Evento / Perfil, **"Guardar" guarda sin cerrar** (los `add*` de
  `useCuadernoStore` devuelven el id nuevo para no duplicar al re-guardar); se cierra con
  el aspa o "Cerrar". La celda de horario NO: ahí guardar-y-cerrar sigue siendo lo normal.

---

## Principios de diseño

1. **Offline-first** — la app funciona 100 % sin conexión tras la primera visita. Nada de
   fuentes/recursos externos: `@fontsource/inter` local, todo precacheado.
2. **Mobile-first** — diseñar para móvil y escalar a escritorio.
3. **Privacidad** — el contenido del cuaderno vive en local; el sync a Supabase es opt-in
   (requiere cuenta). Los recordatorios de eventos solo llegan con la app abierta (no hay
   push server-side).
4. **Accesible** — WCAG AA: contraste ≥ 4.5:1, objetivos táctiles ≥ 32 px, sin
   `user-scalable=no`, un `DialogTitle` por diálogo.
5. **Simple** — curva de aprendizaje mínima para docentes no técnicas.

---

## REGLA DE ORO

**ANTES de modificar código que funciona:**
1. Entender qué hace el código existente.
2. Identificar todas las dependencias y efectos colaterales.
3. Probar para confirmar que el estado actual funciona.
4. Explica lo justo, no más de lo necesario.

**DESPUÉS de modificar:**
1. Probar que lo que funcionaba sigue funcionando (`tsc`, y la parte de `test:unit` /
   `test:e2e` que toque la zona).
2. Probar la funcionalidad nueva.
3. "Cambia poco" no significa "no rompe nada".
