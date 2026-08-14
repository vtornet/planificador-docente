# Docenza - Planificador Digital para Docentes

## Visión General

Aplicación web progresiva (PWA) que permite a los docentes gestionar su planificación escolar de forma digital, similar a un cuaderno físico pero con las ventajas de lo digital: edición, exportación a PDF, sincronización y acceso multi-dispositivo.

**Problema a resolver:** Los docentes utilizan cuadernos físicos de planificación que no permiten edición fácil, búsqueda, copias de seguridad o acceso desde múltiples dispositivos.

**Solución:** Una PWA offline-first que replica la experiencia del cuaderno físico con capacidades digitales.

---

## Estado del Proyecto

**Última actualización:** Agosto 2026

### Fases Completadas ✅
- ✅ **FASE 1:** Fundación - Proyecto configurado con React, Vite, TypeScript, TailwindCSS
- ✅ **FASE 2:** Módulo Horarios - Horarios editables con persistencia
- ✅ **FASE 3:** Calendarios y Planificadores - Calendario mensual y vista semanal
- ✅ **FASE 4:** Módulo Reuniones - CRUD de reuniones con firmas digitales
- ✅ **FASE 5:** Páginas Libres - Notas con editor rico (Tiptap)
- ✅ **FASE 6:** Exportación e Impresión - PDF por módulo, PDF completo del cuaderno y backup JSON (`ExportMenu.tsx`, `utils/pdf.tsx`, `utils/pdfTemplates.tsx`)
- ✅ **FASE 7:** PWA y Offline - Validada (Agosto 2026): funcionamiento 100% offline confirmado (Service Worker activo, IndexedDB persiste, navegación entre las 4 secciones funciona sin red), Lighthouse accesibilidad 75→100 y SEO 91→100 tras corregir bugs reales encontrados. Ver detalle en Tareas Pendientes.

### Fases Pendientes ⏳
- ⏳ **FASE 8:** Testing y Polish
- ⏳ **FASE 9:** Asistente con IA Gratuita

### Lista de Prioridades (Agosto 2026) 🎯
Pedida explícitamente por el usuario, por orden de prioridad. Dos puntos (marcados) los añadí yo al pedirme la lista, el resto ya estaban anotados en "Tareas Pendientes Importantes". Se van marcando `[x]` según se completan, sin borrarlas (para no perder el orden de prioridad acordado ni el motivo de cada una).

- [x] **1. Investigar el desajuste de zona horaria en comparación de fechas** *(añadido por mí)* — ✅ Hecho (Agosto 2026). Ver "DESAJUSTE DE ZONA HORARIA EN FECHAS" más abajo.
- [x] **2. Festivos también en Horarios, + festivos nacionales/autonómicos automáticos** — ✅ Hecho (Agosto 2026). Ver "FESTIVOS AUTOMÁTICOS SEGÚN COMUNIDAD AUTÓNOMA" y "FESTIVOS EN HORARIOS" más abajo.
- [x] **3. Celdas de recreo editables en Calendario y Horarios** — ✅ Hecho (Agosto 2026). Esta lista tenía un dato incorrecto: al comprobarlo, Horarios TAMPOCO lo tenía resuelto (`esRecreo` solo pintaba el icono ☕, las celdas seguían editables) — corregido en los tres sitios. Ver "CELDAS DE RECREO NO EDITABLES" más abajo.
- [x] **4. Botón de cerrar (X) en los modales + botón de volver donde haga falta** — ✅ Hecho (Agosto 2026). Ver "BOTÓN DE CERRAR EN LOS MODALES" más abajo. **Importante, sin resolver:** esto NO arregla que el botón físico/gesto de "atrás" de Android cierre la app en vez de navegar hacia atrás dentro de ella — eso es un problema distinto (la app no usa el History API del navegador) que necesitaría una solución aparte si las docentes de prueba lo siguen usando en vez de los botones en pantalla.
- [x] **5. Reducir el peso del bundle (3,8 MB)** — ✅ Hecho (Agosto 2026). Ver "CODE-SPLITTING DEL BUNDLE" más abajo.
- [x] **6. Formalizar un framework de test** *(añadido por mí)* — ✅ Hecho (Agosto 2026), alcance acotado a Playwright E2E (decisión explícita del usuario, no Vitest ni Chromatic todavía). Ver "FRAMEWORK DE TEST E2E CON PLAYWRIGHT" más abajo.
- [x] **7. Eventos en el PDF y eventos recurrentes** — ✅ Hecho (Agosto 2026). Ver "EVENTOS RECURRENTES Y AGENDA EN PDF" más abajo.
- [ ] **8. Crear BBDD (¿MongoDB en Railway?)** — decisión de arquitectura grande, rompe el offline-first tal cual está hoy; necesita conversación de alcance antes de tocar código.
- [ ] **9. Asistente con IA (Fase 9)** — feature grande y nueva, sin dependencias que la bloqueen.

### Tareas Pendientes Importantes 📌
- **MEJORA VISUAL:** ✅ Hecho (Agosto 2026). Se migraron los 4 módulos (Horarios, Calendario, Reuniones, Notas) y el shell (Sidebar/Header/BottomNav) a los tokens del sistema de diseño (`bg-card`, `text-foreground`, `bg-primary`...), y se implementó el modo oscuro (toggle en el header, persistido en `localStorage`). Verificado visualmente con capturas en claro y oscuro en las 4 secciones y en diálogos/formularios.
- **BUILD ROTO (RESUELTO):** `npm run build` fallaba por tipos faltantes de `file-saver`, un tipo `CeldaHorario` sin importar en `pdfTemplates.tsx`, y el límite de precaché de Workbox (2 MiB) superado por el bundle (3.76 MB). Corregido: `@types/file-saver` instalado, import arreglado, `maximumFileSizeToCacheInBytes` ampliado en `vite.config.ts`.
- **Pendiente para más adelante:** el bundle de producción pesa 3.76 MB (aviso de Vite) — considerar code-splitting con `import()` dinámico cuando se aborde performance (Fase 8).
- **ERROR "DexieError2" AL INICIALIZAR (RESUELTO):** Diagnosticado y arreglado (Agosto 2026). No era un bug de producción: solo se daba con `npm run dev`, nunca en el build (`npm run preview` limpio en 3 intentos). Causa real: `ensureConfig()` en `src/db/db.ts` comprobaba "¿existe la config?" y luego hacía `db.configuracion.add(...)`, sin ser atómico — `React.StrictMode` ejecuta los `useEffect` dos veces en desarrollo, así que las dos llamadas concurrentes a `initDB()` competían y la segunda `.add()` fallaba con `ConstraintError` (clave `'config'` duplicada; Dexie lo muestra como `DexieError2` tras el bundling). El mismo problema podría haber pasado en producción si un usuario abre la PWA en dos pestañas a la vez la primera vez. Arreglado cambiando `.add()` por `.put()` (upsert, no falla con clave duplicada).
- **APARTADO DE PERFIL DE USUARIO:** ✅ Hecho (Agosto 2026). Icono de perfil en `AppHeader` (visible en móvil y escritorio) que abre `PerfilDialog` (`src/components/perfil/PerfilDialog.tsx`) para editar Centro, Docente, Curso escolar y una lista de Cursos/Grupos (ej. "1º ESO A"). Persiste vía la nueva acción `updateMetadata` en `useCuadernoStore.ts` y el campo `cursos?: string[]` añadido a `CuadernoMetadata`. Los datos del perfil ya se usan como valores por defecto en otros módulos:
  - **Reuniones:** el campo "Asistentes" se precarga con el nombre del docente al crear una reunión nueva (`ReunionForm.tsx`).
  - **Horarios:** "Nombre del horario" muestra un desplegable con los cursos del perfil, con fallback a texto libre si no hay ninguno definido (`HorarioManager.tsx`).
  - (Pendiente a futuro si se necesita: email/contacto, etapa educativa, asignatura(s), foto o avatar — no implementado, no se pidió.)
- **VALIDACIÓN PWA/OFFLINE (Fase 7):** ✅ Hecho (Agosto 2026). Probado con Playwright real (no solo lectura de código): Service Worker se activa, precachea todo, y la app carga y funciona 100% offline (creación de cuaderno, navegación entre secciones) tras la primera visita. Se encontraron y corrigieron 3 problemas reales:
  - **Fuente Inter dependía de Google Fonts** (`fonts.googleapis.com`), lo que fallaba offline en la primera visita porque el Service Worker no controla la carga que lo instala a sí mismo. Sustituido por `@fontsource/inter` (subconjunto `latin`, suficiente para español) servido localmente y precacheado — ya no depende de ningún servidor externo, coherente con el principio de privacidad del proyecto. `runtimeCaching` de Google Fonts eliminado de `vite.config.ts` (ya no hace falta).
  - **Contraste de color insuficiente (WCAG AA):** `--primary` (60% lightness) daba solo 3.47:1 contra el texto de los botones (mínimo exigido 4.5:1) — Lighthouse accesibilidad estaba en 75/100 por esto. Además, en modo oscuro `--accent-foreground` usaba texto casi blanco sobre `--accent`, dando solo 2.91:1 (era un bug real de la paleta, no solo de este botón). Ajustados los tonos en `src/index.css` (`--primary`, `--primary-dark`, `--accent`, `--gradient-from/to` en claro; `--primary-dark` y `--accent-foreground` en oscuro) para pasar AA (~4.5-5.9:1) sin cambio visual perceptible.
  - **`user-scalable=no` en el viewport** (`index.html`) bloqueaba el pinch-to-zoom, mala práctica de accesibilidad presente desde la Fase 1. Quitado.
  - Añadido `public/robots.txt` (faltaba, Lighthouse SEO lo marcaba inválido).
  - **Resultado Lighthouse** (build de producción, `localhost`): Accesibilidad 75→100, SEO 91→100, Best Practices 100 (sin cambios). Performance se queda en ~52-53 — no es un bug, es el bundle de 3.76 MB (ver punto de performance más abajo); no se ha tocado en esta pasada.
- **BOTÓN DE CERRAR EN LOS MODALES (RESUELTO):** ✅ Hecho (Agosto 2026). El usuario pidió también "botón de volver en todas las páginas que lo necesiten", porque en las pruebas las docentes usaban el botón físico/gesto de volver del móvil y eso cerraba la app entera (la app no usa el History API del navegador, así que no hay "atrás" que el sistema pueda deshacer).
  - **Auditoría antes de tocar nada** (para no adivinar dónde hacían falta botones): `HorarioManager.tsx`, que es el único sitio de la app con navegación por niveles fuera de un modal (`meses → semanas → semana`), **ya tenía** un botón "Volver a..." funcionando en cada nivel — no hacía falta nada ahí. Todo lo demás en la app (Reuniones, Notas, Perfil, Importar, y todos los sub-diálogos de Calendario: ver semana, festivos, eventos, horario de la semana, crear semana, editar celda...) ya se abre dentro del componente `Dialog` compartido — así que un único arreglo en la base cubre prácticamente toda la app.
  - **Arreglo:** añadida una X en la esquina superior derecha de `DialogContent` (`src/components/ui/dialog.tsx`), visible en todos los diálogos sin tocar cada uno por separado. Objetivo táctil de 32×32px (antes de ajustar, 24×24, algo justo para el dedo en móvil). No cambia el riesgo de ningún diálogo: todos ya se podían cerrar con click fuera o Escape, la X solo lo hace más visible/descubrible.
  - **Importante — lo que esto NO arregla:** el botón/gesto físico de "atrás" de Android seguirá cerrando la app si una docente lo usa en vez de la X o los botones "Volver" en pantalla, porque el problema de fondo es que la app no engancha el History API del navegador (no hace `pushState` al navegar ni escucha `popstate`) — no hay "atrás" que el sistema pueda interceptar. Arreglar eso de verdad sería un cambio más grande y con más riesgo (tocar la navegación global de la app), y no es lo que se pidió esta vez — se deja anotado por si las pruebas siguen mostrando el problema con el botón físico después de este cambio.
  - Verificado con Playwright: la X aparece y cierra el diálogo en Perfil, en "Nuevo horario" y en el diálogo de título largo "¿Guardar todo el periodo o solo esta semana?" (sin solaparse con el texto); confirmado que los botones "Volver a..." de `HorarioManager.tsx` seguían funcionando en cada nivel; en viewport móvil (iPhone 12) la X mide 32×32px y cierra el diálogo al tocarla.
- **CELDAS DE RECREO NO EDITABLES, EN LOS TRES SITIOS (RESUELTO):** ✅ Hecho (Agosto 2026). Antes, `esRecreo` en las filas de periodos solo se usaba para mostrar "☕ Recreo" en la columna de la hora — las celdas de cada día de esa fila seguían siendo editables como cualquier otra, sin distinguirse visualmente, en `HorarioTable.tsx` (Horarios), `VistaSemanal.tsx` y `SemanaEditor.tsx` (Calendario/Planificación).
  - Corregido en los tres: la fila de recreo se pinta con fondo atenuado (`bg-muted/60`) y ya no se puede hacer click para editarla (`HorarioTable.tsx`/`VistaSemanal.tsx`: el manejador de click comprueba `periodo.esRecreo` y no hace nada; `SemanaEditor.tsx`: el `<input>` de esa fila lleva `disabled`). El texto de ayuda "Click para editar" tampoco aparece ya en esas celdas, para no ser engañoso.
  - **Matiz importante para no confundir con el punto de festivos:** en Horarios, los días festivos/de vacaciones YA estaban bloqueados de verdad (ver "FESTIVOS EN HORARIOS"), así que ahí "festivo" y "recreo" bloquean igual. En Calendario/Planificación (`VistaSemanal.tsx`/`SemanaEditor.tsx`), los festivos/vacaciones **siguen siendo solo un aviso visual** (fondo atenuado) sin bloquear la edición — decisión deliberada de no tocarlo esta vez, porque el usuario pidió específicamente "las celdas de recreo", no festivos en Planificación, y cambiar ese comportamiento sin que lo pidieran habría sido asumir de más. El recreo, en cambio, sí bloquea de verdad en los tres sitios porque así se pidió explícitamente.
  - Verificado con Playwright en los tres componentes: en Horarios, click en la fila de recreo no abre el diálogo de editar celda (y una fila normal sí); en `SemanaEditor.tsx` (crear semana), el input de la fila de recreo está deshabilitado; en `VistaSemanal.tsx` (ver una semana ya guardada), click en la fila de recreo no activa el modo edición (no aparece el `<input>`), mientras que una fila normal sí.
- **ASIGNATURAS PREDEFINIDAS EN HORARIOS:** ✅ Hecho (Agosto 2026). `CeldaHorarioDialog.tsx` tiene dos modos:
  - **Ver** (por defecto si la celda ya tiene contenido): muestra la asignatura como título y la nota completa sin recortar, con botones **Cerrar** y **Editar**.
  - **Editar** (por defecto si la celda está vacía, o al pulsar "Editar" desde el modo Ver): desplegable de asignaturas predefinidas (`ASIGNATURAS_PREDEFINIDAS` en `src/types/constants.ts`: Lengua, Matemáticas, Conocimiento del Medio, Atención Educativa, Plástica, Música, Inglés, Francés, Portugués, Religión, Educación Física, Valores Sociales y Cívicos), opción "Otra (personalizada)..." con campo de texto libre, campo de Nota, y "Vaciar celda".

  Se añadió `nota?: string` a `CeldaHorario` (`src/types/index.ts`). La celda en la tabla (`HorarioTable.tsx`) muestra la asignatura recortada a una línea (`truncate`) y, debajo, la nota en cursiva y letra pequeña recortada a 2 líneas (`line-clamp-2`) con icono — **nunca se ensancha la columna**, gracias a que la tabla usa `table-fixed` con anchos de columna fijos (antes, sin `table-fixed`, una nota larga sí ensanchaba la columna y rompía la tabla). Si el texto no cabe, se corta con "..." y el docente puede abrir el modal (modo Ver) para leerlo completo. Solo implementado en Horarios (no en Calendario/planificación semanal, que es contenido más libre, no basado en asignaturas fijas).
- **HORARIOS: NAVEGACIÓN MES → SEMANA → HORARIO:** ✅ Hecho (Agosto 2026). `HorarioManager.tsx` reescrito por completo con navegación real de 3 niveles (aclarado explícitamente por el usuario tras una primera versión que solo agrupaba la lista sin navegación):
  - **Meses** (vista inicial): rejilla con los 11 meses del curso escolar (`MESES` en `constants.ts`, ahora incluye Julio: Septiembre→Julio), cada uno con el nº de horarios vigentes en algún momento de ese mes. Click → **Semanas**.
  - **Semanas**: las semanas (lunes-viernes) de ese mes, calculadas con `date-fns` (`eachWeekOfInterval`, `weekStartsOn: 1`); cada tarjeta muestra el horario vigente esa semana o "Sin horario asignado". Click → **Semana**.
  - **Semana**: muestra el/los horario(s) vigentes esa semana (tabla completa, editar/eliminar) o, si no hay ninguno, un botón "Crear horario para esta semana" que abre el formulario con `fechaInicio`/`fechaFin` precargadas al lunes/viernes de esa semana concreta.
  - Breadcrumb clicable arriba (`Horarios > Septiembre > Semana del 7 al 11`) para volver a cualquier nivel.
  - Cada `Horario` tiene `fechaInicio?: Date` / `fechaFin?: Date` (`src/types/index.ts`) — rango flexible (puede ser una semana o un trimestre entero), no forzado a una semana por horario: se decidió explícitamente con el usuario antes de implementar. Una semana puede no tener ningún horario "propio" y aun así mostrar el que la cubre porque su rango es más amplio (ej. un horario de trimestre completo).
  - **Los horarios sin fecha nunca desaparecen**: quedan fuera de la navegación por mes/semana (no se puede ubicar algo sin fecha en un calendario), así que hay un enlace "Ver N horarios sin periodo asignado" en la vista de Meses que lleva a una vista aparte donde se listan y se pueden editar para asignarles fecha.
  - Al crear desde el botón general "+ Nuevo horario" (visible en cualquier nivel), `fechaInicio` se rellena con hoy y `fechaFin` con el 31 de julio del curso escolar activo (`fechaFin` es opcional, se puede dejar abierto).
  - De paso se eliminó la triplicación de código que arrastraba este archivo desde el principio (el formulario de crear/editar horario estaba copiado 3 veces, una de ellas en un diálogo de creación duplicado solo para el estado vacío): ahora hay un único diálogo de creación y un único componente `HorarioFormFields` reutilizado en creación y edición.
  - **Caso límite de fechas fuera del curso escolar (RESUELTO):** si `fechaInicio` cae fuera de los 11 meses navegables (ej. agosto, o un año que no es el del curso escolar activo), ya no queda invisible: `horariosSinFecha` ahora comprueba también `fecha < inicioCursoEscolar || fecha > finCursoEscolar` (no solo "sin fecha"), así que ese horario aparece en el enlace "Ver N horarios sin periodo asignado". Verificado creando uno con `fechaInicio` en agosto: aparece ahí, y además en los meses con los que solape su rango (si `fechaFin` es amplio) — coherente con el modelo de rango flexible, no es una duplicación errónea.
- **COLOR POR ASIGNATURA:** ✅ Hecho (Agosto 2026). Cada asignatura tiene un color fijo que se aplica a la celda del horario (fondo + texto, con variante `dark:`), para distinguirlas de un vistazo:
  - Las 12 asignaturas predefinidas tienen un color fijo asignado en `COLORES_ASIGNATURAS_PREDEFINIDAS` (`src/types/constants.ts`) — no hace falta elegirlo, siempre es el mismo.
  - Al escribir una asignatura personalizada ("Otra...") que no se haya usado antes, `CeldaHorarioDialog.tsx` muestra un selector con los colores de `PALETA_ASIGNATURAS` (18 en total) que **no** estén ya en uso (ni por las predefinidas ni por otras personalizadas ya creadas). Si algún día se agotan los 6 que quedan libres, deja repetir uno en vez de bloquear.
  - Si esa misma asignatura personalizada ya se usó antes en cualquier celda, no se vuelve a preguntar: se reutiliza el color guardado, así que "Robótica" es siempre del mismo color en todo el horario.
  - El registro de colores de asignaturas personalizadas se guarda en `configuracion.coloresAsignaturas` (`Record<nombre, colorId>`, nuevo campo opcional en `Configuracion`, `src/types/index.ts`), a nivel de cuaderno completo — no por horario — para que el color sea consistente en todos los horarios del docente.
  - `CeldaHorario.color` ahora guarda el **id** del color (ej. `"blue"`), no un hex; `HorarioTable.tsx` resuelve el id a la clase Tailwind de `PALETA_ASIGNATURAS` para pintar la celda (sustituye el `style={{backgroundColor}}` + `bg-opacity-20` que había antes, que en realidad nunca llegó a usarse desde ninguna UI).
- **PDF DE HORARIOS EN HORIZONTAL:** ✅ Hecho (Agosto 2026). `HorarioPDFDocument` en `src/utils/pdfTemplates.tsx` ahora exporta con `orientation="landscape"` (antes solo `size="A4"`, vertical por defecto) — con 5 columnas de días más la de horas, en vertical se recortaba contenido. Verificado leyendo el `/MediaBox` del PDF generado (841.89 x 595.28 pt = A4 horizontal). Solo se tocó la plantilla de Horarios, no la de Semana/Planificación (no se pidió).
- **COLORES DE ASIGNATURA EN EL PDF (RESUELTO):** Quedó como "resultado contradictorio" en una sesión anterior — el color estaba confirmado en los bytes del PDF (`pdfjs-dist`) pero el usuario decía no verlo al abrir el PDF real. Confirmado por el usuario (Agosto 2026) que ahora sí ve los colores correctamente; no se hizo ningún cambio de código en esta sesión para esto (lo más probable, a juzgar por las pistas ya anotadas, es que fuera una opción de "imprimir/mostrar gráficos de fondo" del visor usado, no un bug de la app). Dado por cerrado.
- **PWA NO INSTALABLE EN ANDROID (RESUELTO):** El usuario reportó que en Android solo se podía instalar como "acceso directo", no como app completa. Causa encontrada: `public/icons/icon-192x192.png`, `icon-512x512.png` e `icon-maskable-512x512.png` eran archivos de 5 bytes con el texto literal `"dummy"` — placeholders desde el commit inicial del proyecto (3 de junio), nunca se generaron los PNG reales. Sin iconos válidos, Chrome no cumple los criterios de instalabilidad y ofrece el "acceso directo" básico en vez del diálogo de instalación completo. Generados los 3 PNG reales (192×192, 512×512, y una versión maskable de 512×512 con el fondo azul a sangre completa y el glifo dentro de la "zona segura" del ~62%, para que no se recorte al aplicar la máscara del sistema) a partir del diseño de `favicon.svg`. Verificado: firma PNG válida y dimensiones correctas en los 3 archivos.
  - **Lección para el futuro:** conviene revisar de vez en cuando que los assets de `public/` no sean placeholders olvidados — este llevaba meses así sin que ningún test automatizado lo detectara (Lighthouse tampoco lo pilló porque la categoría PWA ya no se audita por defecto, ver nota de la Fase 7 más arriba).
- **NOTAS TAMBIÉN EN EL PDF (RESUELTO):** El usuario detectó que `celda.nota` nunca se exportaba a PDF — `HorarioPDFDocument` solo pintaba `celda.contenido` (la asignatura), la nota no aparecía por ningún lado aunque sí se veía en la app. Añadido un `<Text>` extra por celda (estilo `tableCellNota`: cursiva, más pequeño, gris o del color de la asignatura si tiene) debajo de la asignatura cuando `celda.nota` existe. Verificado extrayendo el texto real del PDF con `pdfjs-dist`: la nota aparece.
- **EXPORTAR UN SOLO HORARIO A PDF (RESUELTO):** El usuario reportó que la exportación de Horarios era todo-o-nada: la opción del menú "Exportar" cogía `horarios[0]` (el primero, sin poder elegir cuál) en vez de dejar elegir. Ahora hay dos formas explícitas de exportar:
  - **Un horario concreto:** icono de descarga en cada tarjeta de horario (`HorarioManager.tsx`, junto a Editar/Eliminar) → `exportHorarioToPDF` de siempre, solo ese.
  - **Todos a la vez:** la opción "Horarios (todos)" del menú `Exportar` ahora exporta un único PDF con todos los horarios, uno por página (`exportHorariosToPDF` / `HorariosPDFDocument`, nuevos en `pdf.tsx`/`pdfTemplates.tsx`) — antes exportaba solo el primero de forma arbitraria.
  - **Bug de fondo encontrado y arreglado de paso:** `CuadernoCompletoPDF` metía un `<HorarioPDFDocument>` (que ya lleva su propio `<Document>`) dentro de otro `<Document>` — `<Document>` anidado dentro de `<Document>`, estructuralmente inválido en `@react-pdf/renderer`. Solucionado extrayendo `HorarioPDFPage` (el contenido de la página, sin `<Document>` propio), reutilizado tanto en `HorarioPDFDocument` (uno solo) como en `HorariosPDFDocument` (varios) y en `CuadernoCompletoPDF`. **Ojo:** el mismo patrón de anidación sigue presente para Reuniones/Semanas/Notas dentro de `CuadernoCompletoPDF` (no se tocó, no se pidió) — si el PDF completo da problemas con esas secciones, es la misma causa y el mismo arreglo (extraer un `...PDFPage` sin `<Document>`).
  - Verificado con `pdfjs-dist`: exportar 1 horario da un PDF de 1 página con ese horario; exportar "todos" da un PDF de N páginas, una por horario.
- **IMPORTAR COPIA DE SEGURIDAD (Backup JSON):** ✅ Hecho (Agosto 2026). El usuario señaló que solo existía exportar backup, no importar — pero `importCuadernoFromJSON` y `validateCuaderno` ya existían en `src/utils/export.ts` desde hacía tiempo, completos y correctos, simplemente **nunca se habían conectado a ninguna pantalla**. Se construyó la UI que faltaba:
  - Botón "Importar" en `AppHeader.tsx`, junto a "Exportar", abre `ImportDialog.tsx` (nuevo, en `src/components/export/`).
  - Selecciona un `.json`, lo valida (`validateCuaderno`) y muestra una vista previa (centro, docente, curso escolar, nº de horarios/reuniones/notas/semanas) antes de confirmar nada.
  - Aviso explícito de que importar **reemplaza todos los datos actuales** del cuaderno (horarios, reuniones, notas, planificación) y no se puede deshacer — se pide confirmación aparte del simple "seleccionar archivo".
  - Al confirmar, se importa manteniendo el `id` del cuaderno actual (para actualizar el mismo registro en IndexedDB, no crear uno duplicado suelto).
  - Verificado con un ciclo completo: exportar backup → añadir una nota nueva → importar el backup (más antiguo) → la nota nueva desaparece (se reemplaza, no se fusiona) y el horario del backup se restaura con sus datos intactos.
- **PERFIL OBLIGATORIO ANTES DE USAR LA APP:** ✅ Hecho (Agosto 2026). Antes, `App.tsx` creaba el cuaderno con datos inventados (`'Mi Centro'`, `'Docente'`) al primer click, sin pedir nada real, y no había ninguna comprobación después — se podía crear horarios/reuniones/notas sin haber rellenado el perfil nunca.
  - `src/utils/perfil.ts` (nuevo): `perfilCompleto(metadata)` — true solo si `centro`, `docente` y `cursoEscolar` están rellenos (no se exige `cursos`, es opcional a propósito).
  - **Onboarding (`App.tsx`):** el botón único "Crear nuevo cuaderno" pasó a ser un formulario real (Centro, Docente, Curso escolar) con el botón deshabilitado hasta rellenar los 3 campos. `cursoEscolar` se precarga con una sugerencia calculada (`cursoEscolarPorDefecto()`: desde agosto ya sugiere el curso que empieza en septiembre, antes de agosto sugiere el curso en el que aún se está).
  - **Bloqueo permanente (`Layout.tsx` + `CompletarPerfilScreen.tsx`, nuevo en `src/components/perfil/`):** si en cualquier momento `cuadernoActual.metadata` deja de cumplir `perfilCompleto` (ej. el usuario vacía el Centro desde el diálogo de Perfil y guarda), `Layout` deja de renderizar Sidebar/Header/contenido y en su lugar muestra una pantalla de pantalla completa sin forma de saltársela (no es un `Dialog`, así que no se puede cerrar con Escape ni con click fuera) hasta rellenar los 3 campos y guardar.
  - Verificado con Playwright: botón de crear deshabilitado hasta rellenar todo → tras crear con los 3 campos entra directo a la app → vaciar el Centro desde Perfil hace desaparecer el Sidebar y aparecer la pantalla de bloqueo → rellenarlo de nuevo devuelve la app normal.
- **"MODIFICAR SOLO ESTA SEMANA" EN HORARIOS DE PERIODO AMPLIO:** ✅ Hecho (Agosto 2026). Con el modelo de rango flexible, un horario de trimestre completo comparte los mismos datos en todas sus semanas (es el mismo objeto) — el usuario pidió poder alterar una semana suelta sin afectar a las demás. Al ver una semana cuyo horario abarca más que esa semana (`horarioAbarcaMasDeLaSemana`, `HorarioManager.tsx`), aparece un aviso con las dos opciones pedidas:
  - **"Modificar todo el periodo"** — no hace nada especial, solo oculta el aviso para esa combinación semana+horario (edición normal, afecta a todo el rango, como hasta ahora).
  - **"Modificar solo esta semana"** — `dividirHorarioParaSemana()` separa esa semana en un horario independiente y nuevo (mismo nombre/tipo/config, datos clonados tal cual estaban), y recorta el horario original para excluir esa semana. Si la semana estaba en medio del periodo (no al principio ni al final), se generan **dos** piezas: el original recortado (la parte de antes) y un horario nuevo para la parte de después: el original nunca queda con un hueco en medio de su rango.
  - Tras dividir, las ediciones en esa semana ya no afectan a las demás, porque son objetos distintos en la base de datos.
  - Verificado con Playwright: horario de trimestre (8 sept - 20 dic) con "Matemáticas" en todas las semanas → dividir la 2ª semana → cambiarla a "Inglés" → la 1ª y la 3ª semana (antes y después de la dividida) siguen mostrando "Matemáticas" sin cambios.
- **PRÓXIMOS PASOS (anotado por el usuario, Agosto 2026, sin implementar todavía):**
  - **Crear BBDD — ¿MongoDB en Railway?** Esto es un cambio de arquitectura importante: hoy todo se guarda en local con IndexedDB/Dexie, sin servidor (ver "Privacidad" más abajo y el principio "Offline-First"). Pasar a una base de datos remota implica decidir qué pasa con esos principios — ¿sigue siendo offline-first con sync opcional, o pasa a depender de conexión? Antes de implementarlo hay que aclarar con el usuario el alcance (¿sync entre dispositivos del mismo docente? ¿multi-usuario? ¿autenticación?) — no asumir nada, es una decisión de arquitectura, no un detalle de implementación.
  - ~~Notificaciones de avisos de tareas de la agenda~~ — ✅ Hecho como parte de "AGENDA FUNCIONAL: EVENTOS AL ESTILO GOOGLE CALENDAR" más abajo (recordatorios in-app, con la limitación de que solo llegan con la app abierta — no hay servidor de push).
  - ~~Festivos en horarios y agenda~~ — ✅ Hecho, ver entrada "FESTIVOS Y VACACIONES" más abajo.
- **REBRANDING A "DOCENZA":** ✅ Hecho (Agosto 2026). La app pasó a llamarse **Docenza** (antes "Plafinicador Docente"), con el logo real proporcionado por el usuario en la carpeta `Logos/` (imágenes generadas, no vectoriales). Cambios aplicados:
  - Copiados a `src/assets/`: `docenza-logo.png` (logo completo con texto, fondo transparente) y `docenza-icon.png` (solo el icono/glifo "D", fondo transparente) — usados con `import` de Vite, no en `public/` porque no son assets sueltos que deban servirse por URL directa.
  - **Favicon y iconos PWA regenerados** a partir de `Logos/Sin texto.png` (pedido explícito del usuario) con un script Python/Pillow: `public/favicon.ico` (multi-tamaño 16/32/48/64), `public/favicon-256.png` (usado como `<link rel="icon">` principal en `index.html`, PNG en vez de SVG porque no había versión vectorial), `public/icons/icon-192x192.png`, `icon-512x512.png` (fondo transparente, con padding), `icon-maskable-512x512.png` (fondo azul `#3b82f6` a sangre completa — el mismo `theme_color` de la app — con el glifo al 62% para respetar la zona segura de máscara) y `public/icons/apple-touch-icon.png` (180×180, nuevo, no existía antes — iOS no soporta fondo transparente en el icono de inicio, así que lleva el mismo fondo azul que el maskable). Se eliminó `public/favicon.svg` (el icono "D" genérico de antes, ya no se usa).
  - `index.html` (`<title>`, meta description, favicon), `vite.config.ts` (manifest PWA: `name`/`short_name`/`description`), `package.json` y `package-lock.json` (campo `name`), `src/App.tsx` (pantalla de onboarding: logo en vez de emoji, título "Docenza"), `src/components/layout/Sidebar.tsx` (logo e nombre en el panel lateral de escritorio), `src/components/export/ImportDialog.tsx` (mensaje de error), `src/utils/export.ts` y `src/utils/pdf.tsx` (prefijo de los nombres de archivo exportados: `docenza-...` en vez de `plafinicador-...`) y los comentarios de cabecera de `src/types/index.ts` y `src/types/constants.ts`.
  - **Decisión deliberada, sin cambiar:** el nombre interno de la base de datos IndexedDB (`PlafinicadorDB`, en `src/db/db.ts` y la constante sin usar `DB_NAME` de `constants.ts`) **no se ha tocado**. Ese nombre nunca es visible para el usuario, pero SÍ es la clave real bajo la que el navegador guarda los datos — renombrarlo habría creado una base de datos nueva y vacía, perdiendo (a ojos de la app) todos los datos ya guardados por la docente que está probando la app. Si en el futuro se quiere renombrar por limpieza, hace falta una migración explícita (abrir la DB vieja, copiar todo a una `DocenzaDB` nueva, y solo entonces borrar la vieja), no un simple cambio de string.
  - **Pendiente, no pedido esta vez:** el repositorio de GitHub y la URL de GitHub Pages siguen en `planificador-docente` (`vite.config.ts` → `base`, y el remoto `origin`) — no se ha tocado porque cambiar el nombre del repo/URL es una decisión aparte (rompe cualquier enlace ya compartido a la PWA) y no se pidió explícitamente.
- **BOTÓN "GUARDAR CAMBIOS" EN HORARIOS (RESUELTO):** ✅ Hecho (Agosto 2026). Sustituye el flujo anterior de "MODIFICAR SOLO ESTA SEMANA" (ver entrada más arriba), que preguntaba el alcance (todo el periodo / solo esta semana) **antes** de editar, con un aviso permanente y dos botones. El usuario pidió cambiar la dinámica: ahora se edita libremente y se pregunta **al guardar**.
  - `HorarioTable.tsx` guarda las ediciones de celda en un borrador local (`datos`/`dirty`, estado del propio componente) en vez de llamar a `onUpdate` en cada celda como antes — nada se persiste en la base de datos hasta pulsar "Guardar cambios".
  - El botón "Guardar cambios" está deshabilitado hasta que `dirty` es `true` (alguna celda editada). Al pulsarlo: si el horario abarca más semanas que la que se está viendo (`preguntarAlcance`, calculado en `HorarioManager.tsx` con la misma `horarioAbarcaMasDeLaSemana` de antes), se abre un diálogo "¿Guardar todo el periodo o solo esta semana?"; si no, guarda directo sin preguntar.
  - La función `dividirHorarioParaSemana` (ya existente) se reutiliza igual que antes para el caso "solo esta semana", con un único cambio: la semana que se está editando se guarda con los datos del borrador (`nuevos[0] = { ...nuevos[0], datos }`) en vez de con una copia sin editar del horario original.
  - Verificado con Playwright: botón deshabilitado hasta editar una celda, habilitado tras editar, pregunta de alcance visible solo cuando corresponde, "todo el periodo" propaga el cambio a otra semana del mismo horario sin dividir, "solo esta semana" aísla el cambio sin afectar a las semanas anterior y posterior, botón vuelve a deshabilitarse tras guardar.
- **FESTIVOS Y VACACIONES (RESUELTO):** ✅ Hecho (Agosto 2026). Punto "Festivos en horarios y agenda" de los próximos pasos anotados por el usuario, que pidió explícitamente distinguir por color el tipo de festivo. Antes de esto, `Configuracion.festivos`/`.vacaciones` existían en el modelo de datos y `CalendarioMensual.tsx` los pintaba, pero no había ninguna pantalla para añadirlos (arrays siempre vacíos) ni ningún dato de "tipo".
  - **Modelo de datos:** `festivos` pasó de `Date[]` a `Festivo[]` (`{ id, nombre, fecha, tipo }`, con `tipo: 'nacional' | 'autonomico' | 'local'`, `src/types/index.ts`). `Vacacion` ganó un campo `id` (antes solo `nombre`/`inicio`/`fin`) para poder borrar una vacación concreta de la lista sin depender del índice del array. Cambio sin migración: se confirmó antes (código + el propio usuario) que esos arrays estaban siempre vacíos en la práctica, así que no había datos reales que migrar. Actualizado `src/utils/export.ts` (backup JSON) para serializar/deserializar el nuevo `Festivo` en vez del `Date` plano de antes.
  - **Colores por tipo:** `TIPOS_FESTIVO` en `constants.ts` (nacional=rojo, autonómico=verde, local/provincial=morado) y `COLOR_VACACIONES` (ámbar, distinto del azul ya usado por las "semanas planificadas"). Nueva utilidad `src/utils/festivos.ts` (`esDiaFestivo`, `esDiaVacaciones`, y sus variantes `festivoDelDia`/`vacacionDelDia`) para no repetir la lógica de comparación de fechas en cada sitio.
  - **Gestión:** nuevo diálogo `src/components/calendario/FestivosDialog.tsx` (botón "Festivos y vacaciones" en la cabecera de `CalendarioMensual.tsx`) con dos listas independientes (festivos con nombre/fecha/tipo, vacaciones con nombre/inicio/fin), añadir y eliminar en ambas, guardando directamente en `configuracion` vía `updateCuaderno` (mismo patrón que el resto de la app, ej. `CeldaHorarioDialog.tsx`).
  - **Calendario:** los eventos de festivo ya muestran el nombre real (antes siempre decían "Festivo" a secas) y tanto festivos como vacaciones se pintan con su color mediante `eventPropGetter` de `react-big-calendar` (antes todos los eventos —semanas, festivos y vacaciones— salían del mismo azul, sin distinguirse). Añadida una leyenda de colores debajo del calendario.
  - **Planificación semanal:** se terminó de conectar el campo `esFestivo`/`esVacaciones` de `DiaPlanificacion`, que ya existía en el tipo y se leía en el PDF (`pdfTemplates.tsx`) pero se guardaba siempre a `false` al crear una semana nueva (`SemanaEditor.tsx`) — ahora se calcula con `esDiaFestivo`/`esDiaVacaciones` en el momento de crear la semana. Añadido un indicador visual (etiqueta roja "Festivo" / ámbar "Vacaciones" y fondo atenuado en las celdas de ese día) tanto en `SemanaEditor.tsx` (al crear/editar) como en `VistaSemanal.tsx` (al visualizar una semana ya guardada) — antes esta información no se veía en ningún sitio de la interfaz, solo (en teoría, nunca en la práctica porque siempre era `false`) en el PDF.
  - **No incluido en esta pasada (alcance acotado a lo pedido):** Horarios (`HorarioTable.tsx`) no tiene en cuenta los festivos todavía — su columna "Lunes" es una plantilla reutilizada en muchas semanas distintas (no una fecha concreta), así que aplicar festivos ahí requeriría cruzar cada columna con la semana concreta que se esté viendo (`semanaSeleccionada` en `HorarioManager.tsx`), similar a como ya se hace para decidir si preguntar el alcance al guardar. Ni se ha bloqueado la edición de celdas en días festivos en ningún sitio (quedó como "probablemente" en la nota anterior, no confirmado con el usuario). Los días de una `Semana` ya creada tampoco se recalculan si se añade un festivo después de crearla (solo se calcula una vez, al crear).
  - Verificado con Playwright: añadir festivo nacional + autonómico + un periodo de vacaciones desde el diálogo, comprobar que aparecen en la lista y en la leyenda, navegar el calendario y comprobar que el evento del festivo tiene el nombre real y el color correcto (`rgb(239, 68, 68)` = `#ef4444`, nacional), crear una semana nueva que incluye el día festivo y comprobar que la cabecera de esa columna muestra la etiqueta "Festivo" con fondo atenuado.
- **FESTIVOS AUTOMÁTICOS SEGÚN COMUNIDAD AUTÓNOMA (RESUELTO):** ✅ Hecho (Agosto 2026). Antes, `FestivosDialog.tsx` obligaba a añadir cada festivo a mano, uno a uno, sea del tipo que sea.
  - **Fuente de los datos:** antes de escribir nada, se verificaron por web los festivos nacionales de fecha fija, el Viernes Santo de cada año y el día festivo propio de cada comunidad autónoma (BOE, resoluciones de la Dirección General de Trabajo, Wikipedia) — no se inventó ni se confió solo en memoria, precisamente porque una fecha mal puesta aquí podría hacer que una docente real planifique mal una semana. Guardado en `src/types/festivosOficiales.ts`: 9 festivos nacionales de fecha fija, el Viernes Santo (movible) precalculado para los cursos 2024-2025 a 2028-2029 (los que ya cubre `CURSOS_ESCOLARES`), y el día festivo autonómico de las 17 comunidades + Ceuta y Melilla. **Caso especial verificado:** País Vasco no tiene actualmente ningún día festivo autonómico oficial (el "Euskadiko Eguna" del 25 de octubre se derogó en 2013) — se deja sin festivo a propósito, no es un hueco olvidado.
  - **Festivos nacionales:** se cargan automáticamente al crear un cuaderno nuevo (`createCuaderno` en `useCuadernoStore.ts`). Para cuadernos ya existentes (como el de la docente que está probando la app, creado antes de este cambio) hay un botón "Cargar festivos nacionales (N)" en `FestivosDialog.tsx` que aparece solo si falta alguno por añadir (evita duplicarlos si ya están).
  - **Festivos autonómicos:** nuevo desplegable "Comunidad autónoma" en el Perfil (`PerfilDialog.tsx`). Al guardar, si la comunidad ha cambiado, se sustituye el festivo autonómico cargado automáticamente por el de la nueva comunidad — los festivos añadidos a mano (o de cualquier otro tipo) no se tocan. Para poder distinguir "esto lo puse yo" de "esto lo puso la app", `Festivo` ganó un campo opcional `origen?: 'automatico' | 'manual'` (`src/types/index.ts`); en la lista de `FestivosDialog.tsx` los automáticos llevan la etiqueta "· automático".
  - **Festivos locales:** siguen sin automatizar, tal y como se pidió — el docente los sigue añadiendo a mano (son específicos de cada municipio/centro, no hay una fuente única razonable para automatizarlos). El calendario real de LEPE/Huelva ya guardado en memoria (`festivos_calendario_lepe_2026_27.md`) se queda como estaba, de referencia para cuando haga falta un caso de prueba con festivos locales reales.
  - Verificado con Playwright: un cuaderno nuevo trae ya los 10 festivos nacionales cargados (9 fijos + Viernes Santo, con la fecha de 2027 correcta: 26 de marzo); el botón de recarga no aparece si no falta ninguno; elegir Andalucía en el Perfil añade "Día de Andalucía" (28 de febrero); cambiar a Cataluña quita el de Andalucía y añade "Diada de Catalunya" sin tocar los nacionales.
- **FESTIVOS EN HORARIOS (RESUELTO):** ✅ Hecho (Agosto 2026). Completaba la otra mitad del punto 2: Horarios no tenía en cuenta los festivos, a diferencia de Calendario.
  - `HorarioTable.tsx` gana una prop opcional `semana?: { inicio, fin }` — la semana concreta que se está viendo. Con ella, calcula la fecha real de cada columna (lunes a viernes) y consulta `esDiaFestivo`/`esDiaVacaciones` (mismas utilidades de `src/utils/festivos.ts` que ya usaba Calendario) leyendo `configuracion.festivos`/`.vacaciones` directamente de la store (patrón ya usado en `CeldaHorarioDialog.tsx` para los colores de asignatura personalizados).
  - Si una columna cae en festivo o vacaciones: la cabecera muestra la fecha y una etiqueta ("Festivo" en rojo / "Vacaciones" en ámbar, mismos colores que en Calendario/Planificación), la columna entera se pinta con fondo atenuado, y **las celdas de ese día dejan de poder editarse** (el click no abre el diálogo de edición; cursor "no permitido" con un tooltip explicándolo). Sin `semana` (ej. horarios sin fecha asignada en la vista "sin periodo") la tabla se comporta exactamente igual que antes, sin festivos.
  - Conectado en los dos sitios donde se usa `HorarioTable`: `HorarioManager.tsx` (le pasa `semanaSeleccionada` cuando se está en la vista de semana) y el nuevo `HorarioSemanaDialog.tsx` de Calendario (le pasa la semana del evento).
  - Verificado con Playwright: un horario para la semana del 12 al 16 de octubre de 2026 (12 de octubre = Fiesta Nacional) muestra "Festivo" en la cabecera del lunes, y hacer click en cualquier celda de esa columna ya NO abre el diálogo de edición — mientras que el martes (día normal) se sigue pudiendo editar con normalidad.
- **AGENDA FUNCIONAL: EVENTOS AL ESTILO GOOGLE CALENDAR (RESUELTO):** ✅ Hecho (Agosto 2026). El usuario reportó que el Calendario "no era funcional... no deja añadir nada" — lo único que existía era la planificación semanal por periodos (`Semana`/`SemanaEditor`), no había forma de anotar una cita o tarea suelta con hora, color o aviso, como en Google Calendar.
  - **Modelo de datos:** nuevo tipo `Evento` (`src/types/index.ts`): `{ id, titulo, descripcion?, fecha, todoElDia, horaInicio?, horaFin?, color, recordatorio, creado }`, con `recordatorio: 'ninguno' | 'momento' | '10min' | '30min' | '1hora' | '1dia'`. Nuevo array `CuadernoDocente.eventos: Evento[]`. Acciones de store `addEvento`/`updateEvento`/`deleteEvento` en `useCuadernoStore.ts`, mismo patrón que `addReunion`/`addNota`, etc. **Compatibilidad con cuadernos ya existentes** (sin este campo, creados antes de este cambio): todas las lecturas usan `cuadernoActual.eventos || []`, así que no hace falta migración y no rompe con la docente que ya está probando la app. `src/utils/export.ts` actualizado para que el backup JSON incluya `eventos` (serialización/deserialización de sus fechas).
  - **Formulario** `src/components/calendario/EventoDialog.tsx`: título, checkbox "Todo el día" (oculta hora inicio/fin si está marcado), fecha, hora inicio/fin, selector de color (10 colores estilo Google Calendar, `COLORES_EVENTOS` en `constants.ts`), recordatorio (desplegable `RECORDATORIOS`) y descripción libre. Con botón Eliminar cuando se edita un evento existente.
  - **Calendario:** botón azul "Nuevo evento" en la cabecera de `CalendarioMensual.tsx` (junto a "Festivos y vacaciones"), y cada evento se pinta como una franja de color en el mes con su hora delante del título si no es de todo el día (ej. "17:00 Reunión con familias" — el título va concatenado directamente porque el prefijo de hora automático de `react-big-calendar` en vista de mes no se mostraba de forma fiable). Click en un evento ya creado lo abre en modo edición (antes esto no hacía nada para festivos/vacaciones/eventos, solo para semanas). No se ha tocado el click en un día vacío (sigue abriendo la planificación semanal, comportamiento previo intacto) para no romper esa función ya existente — quedan como dos entradas distintas y complementarias, no un reemplazo.
  - **Recordatorios (notificaciones):** nuevo hook `useRecordatoriosEventos` (`src/hooks/`), montado en `Layout.tsx` para que funcione en cualquier sección de la app, no solo en Calendario. Revisa cada 30s (con `setInterval`) si algún evento con recordatorio debe notificarse ya (utilidad pura `src/utils/recordatorios.ts`: `fechaHoraEvento`/`fechaRecordatorio`, verificadas con un script de comprobación aparte — matemática de fechas correcta en los 4 casos probados: recordatorio ya vencido, aún no vencido, ancla de las 09:00 para eventos de todo el día, y "sin recordatorio"). Pide permiso de notificaciones del navegador la primera vez que se guarda un evento con algún recordatorio activado (no de entrada, para no ser intrusivo).
  - **Limitación importante, explicada también en el propio formulario:** al ser una app 100% offline/sin servidor (ver "Privacidad" y "Offline-First" en este documento), los recordatorios **solo pueden llegar mientras la app esté abierta** en el navegador o en la PWA instalada — no hay verdaderas notificaciones push en segundo plano, porque eso requeriría un servidor que las despache (mismo tema de fondo que "Crear BBDD" en los próximos pasos). Si se cierra la pestaña/app antes de la hora del aviso, no llega. Esto cierra la pregunta abierta que quedó anotada en el punto "Notificaciones de avisos de tareas de la agenda" de los próximos pasos.
  - **No incluido en esta pasada:** los eventos no aparecen en la exportación a PDF (solo se pidió que la agenda fuera funcional en la app, no tocar exportación); no hay eventos recurrentes (ej. "todos los lunes") — si hiciera falta, es una ampliación futura del modelo de datos, no un cambio trivial.
  - Verificado con Playwright: crear un evento con hora, color y recordatorio y verlo en el calendario con el prefijo de hora y el color correctos; editarlo (cambio de título reflejado); crear un segundo evento de todo el día (sin prefijo de hora); eliminarlo y comprobar que desaparece. Aparte, un script de verificación de la lógica de fechas de recordatorio (fuera de Playwright, con `tsx`) confirmó los 4 casos de `fechaHoraEvento`/`fechaRecordatorio` mencionados arriba.
- **AMPLIAR LA FECHA DE UN HORARIO BORRABA TODOS LOS DATOS (RESUELTO):** ✅ Hecho (Agosto 2026). El usuario reportó que, al editar un horario para ampliar su periodo de fechas (hacia delante o hacia atrás), se perdía todo el contenido, como si se hubiera creado uno nuevo. Investigando, el bug no era solo al ampliar fechas: **ocurría al guardar el diálogo "Editar horario" pase lo que pase**, aunque solo se cambiara el nombre.
  - **Causa raíz** (`HorarioManager.tsx`): `configHorarios` es un campo obligatorio de `Horario` (nunca `undefined`), pero `handleEditarClick` decidía si marcar la casilla "Personalizar intervalos horarios" con `if (horario.configHorarios) { setConfigPersonalizada(true) } else { setConfigPersonalizada(false) }` — como `configHorarios` SIEMPRE existe, esa condición daba `true` siempre y el `else` nunca se ejecutaba. Y `handleGuardarEdicion` vaciaba la matriz de datos completa cada vez que `configPersonalizada` era `true` (pensado solo para cuando de verdad cambian los intervalos horarios, no para cualquier guardado). Resultado: cualquier edición del horario —cambiar fechas, nombre, tipo, lo que fuera— borraba el contenido, porque `configPersonalizada` estaba mal inicializado.
  - **Arreglo:** 1) `handleEditarClick` ahora usa una nueva función `esConfigPredefinidaSecundaria()` que compara la configuración real del horario contra la predefinida de secundaria, para marcar la casilla solo cuando corresponde de verdad. 2) `handleGuardarEdicion` ya no vacía los datos según el estado de la casilla, sino comparando el **número total de periodos** (incluido el recreo) antes y después — solo se vacía la matriz si ese número cambia de verdad, que es el único caso en que la matriz existente ya no encajaría en la tabla.
  - Verificado con Playwright: crear un horario con datos, ampliar la fecha fin hacia delante (dato se mantiene), ampliar la fecha inicio hacia atrás (dato se mantiene), renombrar sin tocar fechas (dato se mantiene), y confirmado que la casilla "Personalizar intervalos horarios" aparece desmarcada al editar un horario que nunca se personalizó (antes aparecía siempre marcada). También confirmado que el vaciado SÍ sigue ocurriendo cuando de verdad se cambia el nº de periodos (comportamiento correcto, no se ha roto).
  - **Encontrado de paso en esta prueba (posible bug latente, no corregido hasta más tarde):** la pregunta de "¿todo el periodo o solo esta semana?" apareció en un caso donde el rango del horario coincidía exactamente con la semana mostrada — indicio de un desajuste de zona horaria. **✅ Confirmado y resuelto más abajo, ver "DESAJUSTE DE ZONA HORARIA EN FECHAS".**
- **LAS NOTAS DE LAS CELDAS NO RESPETABAN LOS SALTOS DE LÍNEA EN LA VISTA GENERAL (RESUELTO):** ✅ Hecho (Agosto 2026). El usuario reportó que, al escribir una nota con varias líneas en una celda del horario, el modo "Ver" (al hacer click) sí las respetaba, pero la previsualización recortada dentro de la propia tabla las juntaba todas en una. Causa: el `<span>` de la nota en `HorarioTable.tsx` tenía `line-clamp-2` (recorte a 2 líneas) pero no `whitespace-pre-wrap`, así que el navegador colapsaba los saltos de línea por defecto (comportamiento CSS estándar de `white-space: normal`). Añadida la clase `whitespace-pre-wrap`, igual que ya tenía el modo "Ver" en `CeldaHorarioDialog.tsx`. El recorte a 2 líneas y el ancho/alto fijo de la celda (heredados de `line-clamp-2`, `break-words` y la tabla `table-fixed`) siguen intactos — no se ensancha ni se descuadra la tabla. Verificado con Playwright: una nota de 3 líneas se ve como "Línea 1 / Línea 2..." en la celda (la 3ª se recorta, como se pedía), la tabla mantiene su ancho, y al hacer click se sigue viendo la nota completa con sus 3 líneas (eso ya funcionaba).
- **EVENTOS: SE SALÍAN DE SU CELDA, Y NUEVO SELECTOR "VER EVENTO O VER HORARIO DE LA SEMANA" (RESUELTO):** ✅ Hecho (Agosto 2026). El usuario reportó dos problemas en el Calendario: 1) al crear un evento, ocupaba más de una celda de ancho en la vista de mes; 2) pidió que, al hacer click en un evento, se pudiera elegir entre ver ese evento o ver el horario de clase (módulo Horarios) de esa semana concreta, avisando de que la nueva vista tenía que tirar de los datos reales, no de una tabla en blanco.
  - **Causa del evento "ancho de más de una celda"** (`CalendarioMensual.tsx`): para eventos de todo el día, `end` se calculaba como `fecha + 24h`, que cae exactamente en la medianoche del día siguiente. `react-big-calendar` interpreta eso como que el evento también ocupa la celda de ese día siguiente. Arreglado usando `endOfDay(fecha)` (23:59:59.999 del mismo día) en vez de la medianoche del día después — mismo cambio aplicado también a los festivos de un solo día, que tenían el mismo patrón. De paso, para eventos con hora, si la hora de fin quedaba igual o antes que la de inicio, o caía ya en el día siguiente, también se recorta a `endOfDay` del inicio, para que nunca "invada" la celda de al lado.
  - **Selector "¿Qué quieres ver?"**: al hacer click en un evento ya no se abre directamente su edición — aparece un diálogo pequeño con dos botones, "Ver evento" (abre `EventoDialog` como antes) y "Ver horario de esta semana" (nuevo). No se ha tocado el click en huecos vacíos del calendario ni en los eventos de "Semana" planificada (siguen igual que antes) — el selector solo aparece para eventos de la agenda, que es donde se pidió.
  - **Nuevo diálogo `HorarioSemanaDialog.tsx`**: dado un rango de semana (lunes de la semana del evento a viernes), busca en `cuadernoActual.horarios` los que estén vigentes esa semana (misma función `horarioActivoEnRango` que ya usaba `HorarioManager.tsx`) y los muestra reutilizando el componente `HorarioTable` real — por eso los datos que aparecen son los mismos que se ven y editan desde la pestaña Horarios, nunca una copia vacía. Si ningún horario cubre esa semana, muestra un aviso con un botón "Ir a Horarios" en vez de una tabla en blanco confusa. Si el horario encontrado abarca más de esa semana, ofrece la misma pregunta de alcance ("todo el periodo" / "solo esta semana") que ya existía en Horarios, con el mismo comportamiento de división.
  - **Refactor de apoyo:** `horarioActivoEnRango`, `horarioAbarcaMasDeLaSemana`, `dividirHorarioParaSemana` y `formatRangoFechas` estaban definidas solo dentro de `HorarioManager.tsx` (no exportadas); se han movido a `src/utils/horarios.ts` para poder reutilizarlas también desde `HorarioSemanaDialog.tsx` sin duplicar la lógica de división de horarios. `HorarioManager.tsx` ahora las importa desde ahí, sin cambios de comportamiento.
  - Verificado con Playwright: un evento de todo el día ahora mide lo mismo que una celda de día normal (antes se salía); al hacer click aparece el selector; eligiendo "Ver horario de esta semana" se abre con el título de la semana correcta y la celda muestra el contenido real ya guardado en Horarios (no vacío); eligiendo "Ver evento" se sigue abriendo la edición del evento como antes.
  - **Aclaración pedida y descartada en la misma conversación:** el usuario pensó inicialmente que no se podía elegir la hora al crear un evento, pero era porque el checkbox "Todo el día" venía premarcado por defecto (lo oculta a propósito, es el comportamiento esperado) — no era un bug, no se ha tocado `EventoDialog.tsx` por este punto.
- **BOTONES "FESTIVOS Y VACACIONES" / "NUEVO EVENTO" SE SALÍAN DE LA PANTALLA EN MÓVIL (RESUELTO):** ✅ Hecho (Agosto 2026). Mismo patrón de fix que ya se aplicó antes al aviso de "Modificar todo el periodo/solo esta semana" en Horarios: el contenedor de esos dos botones en la cabecera de `CalendarioMensual.tsx` era `flex items-center gap-2` (siempre en fila, sin `wrap`), así que en pantallas estrechas no cabían y se salían del ancho de la pantalla. Cambiado a `flex flex-col sm:flex-row` con `w-full sm:w-auto` en ambos botones, para que en móvil queden apilados uno debajo del otro a todo lo ancho, y en escritorio sigan en la misma línea como antes. Verificado con Playwright en viewport de iPhone 12 (375px): sin overflow horizontal, los dos botones en líneas (coordenadas Y) distintas y dentro del ancho de pantalla.
- **DESAJUSTE DE ZONA HORARIA EN FECHAS (RESUELTO):** ✅ Hecho (Agosto 2026). Era el nº1 de una lista de tareas pendientes que el usuario pidió priorizar; había quedado anotado como "bug latente, no confirmado" en dos entradas anteriores (reaparecía de forma consistente en las pruebas). Confirmado y corregido esta vez.
  - **Causa raíz:** `new Date('2026-09-07')` (el valor típico de un `<input type="date">`) se interpreta como medianoche **UTC**, no medianoche local. El resto de la app construye fechas con `date-fns` (`startOfWeek`, `addDays`, `new Date(año, mes, día)`...), siempre en hora **local**. En `Europe/Madrid` (UTC+2 en verano) esto desajusta las fechas guardadas desde formularios 2 horas por delante de las fechas calculadas internamente — suficiente para que comparaciones de "coincide exactamente con esta semana" fallaran cerca de la medianoche (ej. un horario del lunes al viernes exactos disparaba igualmente la pregunta de "todo el periodo/solo esta semana", porque `fechaFin` (viernes 00:00 UTC) quedaba 2h por delante del `semana.fin` calculado en local).
  - **Arreglo:** nueva utilidad `parseFechaInput()` (`src/utils/fechas.ts`) que parsea un string `"yyyy-MM-dd"` construyendo el `Date` directamente en hora local (`new Date(año, mes-1, día)`), igual que ya hacía el resto de la app. Sustituye a `new Date(string)` en los 6 sitios reales donde se leía un `<input type="date">` y se guardaba: `HorarioManager.tsx` (crear y editar horario, 2 sitios), `EventoDialog.tsx`, `FestivosDialog.tsx` (festivo y vacación), `ReunionForm.tsx`, y de paso en las fechas de curso por defecto de `useCuadernoStore.ts` y en el seed (sin usar en la práctica, pero mismo patrón) de `db.ts`. No se ha tocado ningún sitio donde el valor ya era un objeto `Date` (los que vienen de IndexedDB/el store) ni los timestamps ISO completos de import/export de backups (esos ya eran consistentes porque exportan e importan siempre con la hora incluida).
  - Verificado con Playwright: un horario del lunes al viernes exactos de una semana ya NO dispara la pregunta de alcance ni el aviso previo (antes sí, de forma reproducible); un horario de trimestre real (varias semanas de verdad) sigue disparando la pregunta correctamente y la división "solo esta semana" sigue aislando los datos sin afectar a las semanas vecinas (regresión comprobada, no se ha roto nada); un festivo puesto un lunes concreto aparece listado y pintado en el calendario ese mismo día, no el anterior ni el siguiente.
- **CODE-SPLITTING DEL BUNDLE (RESUELTO):** ✅ Hecho (Agosto 2026). Punto 5 de la lista de prioridades. `npm run build` avisaba de un único bundle de 3,8 MB (`index-*.js`, 1,1 MB gzip) — todo el código de la app (las 4 secciones, `@react-pdf/renderer`, Tiptap, `react-big-calendar`...) se cargaba de golpe en la primera visita, aunque `App.tsx` solo renderiza una sección a la vez (no hay router, es un `switch` sobre `view`).
  - **Vistas principales** (`App.tsx`): `HorarioManager`, `CalendarioMensual`, `ReunionList` y `NotasList` pasaron de import estático a `React.lazy(() => import(...))`, envueltos en un único `<Suspense>` alrededor de `{viewComponent}` dentro de `Layout` (spinner simple de fallback). Cada sección se descarga solo la primera vez que la docente la visita.
  - **Exportación a PDF** (`ExportMenu.tsx`, y el icono de descarga individual en `HorarioManager.tsx`): `@react-pdf/renderer` es, con diferencia, la dependencia más pesada (2,4 MB, 720 KB gzip — incluye su propio motor de layout y subsetting de fuentes, más los polyfills de Node que necesita para funcionar en el navegador). Antes se importaba de forma estática en `utils/pdf.tsx`, así que se cargaba entera aunque la docente no exportara nunca nada. Cambiado a `const { exportXToPDF } = await import('../../utils/pdf.tsx')` dentro de cada `case` del `switch` de exportación (y en `handleExportarPDF` de `HorarioManager.tsx`) — solo se descarga en el momento real de pulsar "Exportar".
  - **Resultado** (`npm run build`): el bundle que se necesita para la primera carga bajó de 3,8 MB a ~380 KB (124 KB gzip) + la sección que se esté viendo (Horarios: 18 KB; Calendario: 200 KB, por `react-big-calendar`; Reuniones: 13 KB; Notas: 449 KB, por Tiptap). `@react-pdf/renderer` (2,4 MB) queda en un chunk aparte que solo se pide al exportar. El precache total del Service Worker (para el funcionamiento offline, ver Fase 7) se mantiene similar (~4,2 MB) porque sigue cacheando todo para que funcione sin conexión — el ahorro es en lo que hay que descargar y ejecutar en la visita inicial, no en lo cacheado.
  - **No tocado:** no se ha añadido `manualChunks` ni se ha tocado `vite-plugin-node-polyfills` (sigue siendo necesario porque `@react-pdf/renderer` usa `Buffer`/`process` en el navegador) — Rollup ya coloca esos polyfills en el chunk de `pdf.tsx` automáticamente porque es el único sitio que los usa. Vite sigue avisando de que el chunk de `pdf-*.js` supera los 500 KB, pero es esperado y aceptable al ser un chunk asíncrono que no bloquea la carga inicial.
  - **Verificado:** `npm run build` sin errores de tipos (`tsc` incluido en el script) y con los chunks nuevos separados en la salida; `npm run preview` sirviendo la app y comprobación de que todos los `.js`/`.css` generados responden 200 (sin 404 de chunks). **Pendiente de confirmar por el usuario:** no se pudo hacer una prueba de click-through real en el navegador en esa sesión (la extensión de Chrome no estaba conectada) — confirmado indirectamente en la sesión siguiente, ver "FRAMEWORK DE TEST E2E CON PLAYWRIGHT" justo debajo: la batería de tests E2E ejercita los 4 módulos y la exportación a PDF de verdad, en un navegador real, y todo pasa.
- **FRAMEWORK DE TEST E2E CON PLAYWRIGHT (RESUELTO):** ✅ Hecho (Agosto 2026). Punto 6 de la lista de prioridades. Hasta ahora, cada sesión que quería probar la app con Playwright lo instalaba con `npx playwright ...` puntualmente y no quedaba nada reutilizable en el repo (ni config, ni tests, ni dependencia en `package.json`) — cada verificación (offline, festivos, code-splitting...) se perdía al terminar la sesión. El usuario, preguntado por el alcance, eligió explícitamente **"Solo Playwright E2E"** (no Vitest, no Chromatic todavía — quedan pendientes en "Testing Strategy" más abajo).
  - **Instalado de verdad:** `@playwright/test` como devDependency real (antes solo vivía de forma efímera en `node_modules` vía `npx`, sin entrada en `package.json`/`package-lock.json`). Navegador Chromium descargado vía `npx playwright install`.
  - **`playwright.config.ts`** (nuevo, raíz del proyecto): `testDir: './e2e'`, un único proyecto `chromium` (no se ha añadido Firefox/WebKit ni un segundo proyecto "mobile" — el viewport móvil se cubre con `test.use({ viewport })` puntual dentro de los tests que lo necesitan, para no doblar el tiempo de ejecución de toda la batería). `webServer` ejecuta `npm run build && npm run preview` (no `npm run dev`) a propósito: es la única forma de probar el Service Worker/PWA de verdad (`vite-plugin-pwa` no está activo en modo dev salvo que se configure `devOptions.enabled`), y así los tests corren contra lo mismo que se despliega. `reuseExistingServer: !process.env.CI` para no reconstruir en cada corrida local si ya hay un preview levantado.
  - **`e2e/helpers.ts`** (nuevo): `crearCuaderno(page, datos?)` completa el onboarding (cada test de Playwright arranca con un browser context nuevo, así que IndexedDB está vacía siempre al empezar — no hace falta limpiar nada entre tests) e `irASeccion(page, seccion)` navega con el Sidebar de escritorio. Reutilizados por casi todos los specs para no repetir el boilerplate de onboarding en cada uno.
  - **7 archivos de test** (`e2e/*.spec.ts`), 11 tests en total, cubriendo los flujos críticos que en sesiones anteriores se verificaban a mano con Playwright efímero y luego se perdían: onboarding (validación del botón deshabilitado + creación real), navegación por las 4 secciones (desktop con Sidebar Y móvil con BottomNav — los labels difieren entre ambos, ej. "Calendario" en Sidebar vs "Planificar" en BottomNav, y esto ya sirvió para pillar un bug real, ver abajo), Horarios (crear horario, asignar una asignatura a una celda, guardar, y confirmar que persiste tras recargar la página — ejercita IndexedDB de verdad, no mocks), Calendario (crear un evento y verlo pintado), Reuniones y Notas (crear con el editor Tiptap real), exportación (PDF completo y backup JSON, esperando el evento `download` real del navegador), y un test de offline que registra el Service Worker, fuerza `context.setOffline(true)` y confirma que la app sigue funcionando y que se puede navegar a una sección cargada de forma perezosa (con el code-splitting del punto 5 de esta lista) estando sin conexión.
  - **Bug real encontrado y arreglado al escribir el test de navegación móvil:** en viewport de móvil (390×844), tras entrar en Calendario y intentar tocar cualquier otro botón de la barra inferior (`BottomNav`), el toque no llegaba — Playwright lo reportó como "elemento tapado" (`rbc-row-content` interceptando el click) de forma reproducible. Causa: la última fila del grid mensual de `react-big-calendar` (`.rbc-row-content`) establece su propio contexto de apilamiento con `z-index` positivo (típico de esa librería, para que los eventos floten sobre los números de día); `BottomNav` es `position: fixed` pero **no tenía ningún `z-index` explícito** (`z-index: auto`), así que perdía frente a esa fila del calendario y quedaba visualmente encima pero *inerte al tacto* en esa zona — un bug de verdad, no un falso positivo del test, y invisible en desktop (por eso no se había detectado en las validaciones manuales anteriores, todas hechas con viewport de escritorio). Arreglado añadiendo `z-40` a `BottomNav.tsx` (`src/components/layout/BottomNav.tsx`), muy por encima de los z-index internos de `react-big-calendar`. No se ha tocado `Sidebar.tsx` (mismo patrón `fixed` sin z-index) porque solo es visible en desktop, donde no se ha reproducido ningún problema de solapamiento.
  - **Scripts nuevos** (`package.json`): `npm run test:e2e` (correr toda la batería), `test:e2e:ui` (modo interactivo de Playwright), `test:e2e:report` (abrir el último informe HTML).
  - **`.gitignore`:** añadidas `/test-results/`, `/playwright-report/`, `/blob-report/` (artefactos de cada corrida, no deben versionarse).
  - **No incluido en esta pasada (alcance acotado a lo que pidió el usuario):** sin Vitest (tests unitarios de utilidades puras como `fechas.ts`, `festivos.ts`, `recordatorios.ts` — ya se verificaron una vez con scripts sueltos de `tsx` en sesiones anteriores, pero no quedaron como test reutilizable), sin Chromatic (regresión visual), sin integración en CI (no hay pipeline configurado en este repo todavía). Los 11 tests corren solo contra Chromium, no Firefox/WebKit/Safari real.
  - **Verificado:** los 11 tests pasan de forma consistente (corridos dos veces seguidas con `--repeat-each=2`, 22/22), incluyendo una repetición completa después de aplicar el fix del `z-index` para confirmar que el bug queda resuelto y no es un test flaky.
- **EVENTOS RECURRENTES Y AGENDA EN PDF (RESUELTO):** ✅ Hecho (Agosto 2026). Punto 7 de la lista de prioridades, dejado fuera a propósito al construir la agenda (ver "AGENDA FUNCIONAL" más abajo). Alcance decidido explícitamente por el usuario: recurrencia diaria/semanal/mensual con fecha de fin obligatoria (no "nunca", para no generar eventos indefinidos en una app sin backend), y los eventos se exportan en una opción nueva del menú Exportar, no dentro del PDF completo.
  - **Modelo de datos:** `Evento` gana `recurrencia?: { frecuencia: 'diaria' | 'semanal' | 'mensual'; hasta: Date }` (`src/types/index.ts`). Un evento recurrente es un único registro "maestro" (`fecha` = primera ocurrencia); las ocurrencias siguientes **no se guardan como registros aparte**, se calculan al vuelo con la nueva utilidad `src/utils/recurrencia.ts` (`fechasOcurrencias(evento)`, con un tope de seguridad de 731 iteraciones para no generar de más si alguien pone una fecha de fin absurdamente lejana). Consecuencia directa de este diseño, explicada también en la propia UI: **editar o eliminar un evento recurrente afecta a todas sus ocurrencias**, no hay edición de una ocurrencia suelta (esa granularidad — "solo este evento" / "este y los siguientes" / "todos", al estilo Google Calendar — se consideró pero quedaba fuera del alcance pedido).
  - **`EventoDialog.tsx`:** nuevo desplegable "Repetir" (No se repite / Cada día / Cada semana / Cada mes) y, si no es "No se repite", un campo "Repetir hasta \*" obligatorio (valida que no sea anterior a la fecha del evento). Aviso de texto bajo el campo cuando hay recurrencia activa, y el diálogo de confirmación de "Eliminar" cambia de mensaje si el evento es recurrente, para que quede claro que se borra la serie entera.
  - **`CalendarioMensual.tsx`:** el `useMemo` que construye los eventos del calendario ahora expande cada evento con `fechasOcurrencias()` y genera una entrada por ocurrencia (mismo `eventoId` en todas, para que clicar cualquiera abra el mismo evento maestro). De paso se corrigió un bug pequeño pero real que este cambio habría heredado si no se tocaba: `handleSelectEvent` calculaba "la semana de este evento" (para el botón "Ver horario de esta semana") a partir de `evento.fecha` siempre — con eventos recurrentes eso habría mostrado la semana de la *primera* ocurrencia sin importar en cuál se hubiera hecho click. Ahora usa la fecha de la ocurrencia concreta clicada (`event.start`).
  - **Recordatorios (`useRecordatoriosEventos.ts` / `utils/recordatorios.ts`):** mismo problema de fondo que en el calendario, pero más serio si no se arreglaba — antes de este cambio, un evento recurrente con recordatorio activado **solo habría avisado en su primera ocurrencia y nunca más** (`fechaHoraEvento`/`fechaRecordatorio` siempre usaban `evento.fecha`, y una vez marcada como "ya notificada" esa clave no volvía a dispararse). Arreglado dando a ambas funciones un segundo parámetro opcional `fecha` (por defecto `evento.fecha`, así que las llamadas ya existentes sin tocar siguen igual) y haciendo que el hook recorra `fechasOcurrencias(evento)` y compruebe/marque el recordatorio de cada ocurrencia por separado.
  - **PDF de agenda (`AgendaPDFDocument` en `pdfTemplates.tsx`, `exportEventosToPDF` en `pdf.tsx`):** nueva opción "Agenda (eventos)" en el menú Exportar (`ExportMenu.tsx`, deshabilitada si no hay eventos, igual que el resto de opciones), con import dinámico de `pdf.tsx` como las demás (ver "CODE-SPLITTING DEL BUNDLE" más arriba — no se ha vuelto a cargar `@react-pdf/renderer` de forma estática). El PDF lista, ordenadas cronológicamente, todas las ocurrencias (incluidas las de eventos recurrentes) que caen dentro del curso escolar activo (`configuracion.fechaInicioCurso`/`fechaFinCurso`), con fecha, hora (o "Todo el día"), título — con la etiqueta "(recurrente)" si procede — y descripción si tiene.
  - **Backup JSON (`export.ts`):** `recurrencia.hasta` se serializa/deserializa igual que el resto de fechas del cuaderno (`dateToISO`/`isoToDate`), para que un evento recurrente sobreviva a un export/import de backup sin perder la recurrencia.
  - **Tests E2E nuevos** (`e2e/calendario.spec.ts`, `e2e/export.spec.ts`, ver "FRAMEWORK DE TEST E2E CON PLAYWRIGHT" arriba): un evento semanal con "Repetir hasta" a +21 días se comprueba en la vista "Agenda" del calendario (no en la vista de mes, para no depender de en qué día del mes se ejecute el test) y confirma exactamente 4 ocurrencias (día 0, 7, 14 y 21); y un test de exportación que comprueba que "Agenda (eventos)" empieza deshabilitada sin eventos y descarga un PDF real (`agenda-*.pdf`) al crear uno. Los 13 tests de la batería completa pasan.

---

## Stack Tecnológico

### Frontend
- **React 18** + **Vite** - Framework y build tool para desarrollo rápido
- **TypeScript** - Tipado estático para mayor robustez
- **TailwindCSS** - Estilos utility-first, responsive por defecto

### UI Components
- **shadcn/ui** - Componentes accesibles y personalizables
  - Dialog, Sheet, Select, Tabs, Card, Button, Input, Textarea, etc.

### Estado y Datos
- **Zustand** - Gestión de estado ligera y simple
- **Dexie.js** - Wrapper de IndexedDB para almacenamiento local robusto
- **React Hook Form + Zod** *(planificado, no instalado)* - Los formularios actuales (reuniones, notas, horarios) usan `useState` nativo con validación manual. Migrar si los formularios ganan complejidad.

### Calendario
- **React Big Calendar** - Calendario interactivo personalizable
- **date-fns** - Utilidades para manejo de fechas (calendario escolar septiembre-agosto)

### Exportación
- **@react-pdf/renderer** - Generación de PDFs programática (`src/utils/pdf.tsx`, `src/utils/pdfTemplates.tsx`)
- **file-saver** - Descarga de PDFs y backups JSON en el navegador

### PWA
- **Vite PWA Plugin (vite-plugin-pwa)** - Service workers y manifest automáticos
- **Workbox** - Estrategias de cache y sincronización

### Editor Rico
- **Tiptap** - Editor de texto rico basado en ProseMirror
  - Soporte para tablas, imágenes, listas, etc.

### Inteligencia Artificial
- **API de IA gratuita** - Por determinar (Hugging Face, Groq, OpenRouter, etc.)
  - Asistente para ayuda con documentos
  - Prompts especializados por módulo

---

## Arquitectura

### Estructura de Datos Principal

```typescript
// Tipos principales de la aplicación

interface CuadernoDocente {
  id: string;
  metadata: {
    cursoEscolar: string; // "2026-2027"
    centro: string;
    docente: string;
    creado: Date;
    actualizado: Date;
  };
  horarios: Horario[];
  planificacion: Planificacion[];
  reuniones: Reunion[];
  notas: Nota[];
}

interface Horario {
  id: string;
  tipo: 'docente' | 'alumnado';
  nombre: string;
  datos: CeldaHorario[][]; // [hora][dia]
}

interface CeldaHorario {
  contenido: string;
  color?: string;
}

interface PlanificacionMensual {
  mes: number; // 1-12
  año: number;
  semanas: Semana[];
}

interface Semana {
  id: string;
  fechaInicio: Date;
  fechaFin: Date;
  dias: DiaPlanificacion[];
  observaciones: string;
}

interface DiaPlanificacion {
  fecha: Date;
  periodos: Periodo[];
}

interface Periodo {
  horaInicio: string;
  horaFin: string;
  contenido: string;
}

interface Reunion {
  id: string;
  titulo: string;
  fecha: Date;
  asistentes: string[];
  asuntosTratados: string;
  acuerdos: string;
  firmas: Firma[];
}

interface Nota {
  id: string;
  titulo: string;
  categoria: string;
  contenido: string; // HTML del editor rico
  tipo: 'texto' | 'imagen' | 'tabla' | 'mixto';
  tags: string[];
  creado: Date;
}
```

### Almacenamiento Local (IndexedDB)

```
Base de datos: PlafinicadorDB
├── cuadernos (store)
│   ├── keyPath: id
│   └── indexes: cursoEscolar, centro
├── configuracion (store)
│   └── keyPath: id (singleton)
└── backup (store)
    └── timestamps de backups
```

---

## Roadmap de Desarrollo

### FASE 1: Fundación (Semana 1-2)
**Objetivo:** Configuración base del proyecto y arquitectura fundamental.

**Tareas:**
- [ ] Inicializar proyecto Vite + React + TypeScript
- [ ] Configurar TailwindCSS y tema personalizado
- [ ] Instalar y configurar componentes shadcn/ui base
- [ ] Configurar vite-plugin-pwa (manifest.json, service worker)
- [ ] Definir tipos TypeScript para toda la data
- [ ] Crear store Zustand principal con estructura base
- [ ] Implementar IndexedDB con Dexie.js y migraciones
- [ ] Diseñar y validar sistema de navegación (bottom nav mobile / sidebar desktop)
- [ ] Crear layout responsive mobile-first
- [ ] Configurar ESLint, Prettier, y Husky para pre-commits

**Entregables:**
- Proyecto ejecutable en dev y prod
- PWA instalable (validado con Lighthouse)
- Layout responsivo con navegación funcional

---

### FASE 2: Módulo Horarios (Semana 3)
**Objetivo:** Tablas de horarios editables para docente y alumnado.

**Tareas:**
- [ ] Crear componente `HorarioTable` (6 columnas × 7-8 filas)
- [ ] Implementar edición inline de celdas (click/doble-click)
- [ ] Añadir selector de filas/columnas personalizables
- [ ] Implementar duplicación de horario (crear horario de alumnado basado en docente)
- [ ] Diseñar vista móvil con scroll horizontal
- [ ] Añadir colores personalizados por celda
- [ ] Validar persistencia en IndexedDB
- [ ] Implementar undo/redo básico

**Entregables:**
- Horarios completamente funcionales
- Edición fluida con autoguardado
- Vista optimizada para móviles

---

### FASE 3: Calendarios y Planificadores (Semana 4-5)
**Objetivo:** Sistema de planificación mensual y semanal integrado.

**Tareas:**
- [ ] Integrar React Big Calendar
- [ ] Personalizar vista mensual (calendario escolar septiembre-agosto)
- [ ] Implementar expansión de mes a vista semanal
- [ ] Crear editor de slots horarios semanales (7-8 periodos configurables)
- [ ] Implementar estructura de periodos lectivos
- [ ] Añadir sección de observaciones/notas por semana
- [ ] Implementar navegación entre semanas/meses
- [ ] Crear sistema de plantillas semanales (copiar estructura)
- [ ] Añadir indicadores de contenido en vista mensual
- [ ] Implementar configuración de tramos horarios por centro

**Entregables:**
- Calendario mensual interactivo
- Vista semanal con periodos editables
- Sistema de plantillas y copias
- Observaciones por semana

---

### FASE 4: Módulo Reuniones (Semana 6)
**Objetivo:** Gestión completa de reuniones con estructura documentada.

**Tareas:**
- [ ] Diseñar formulario `ReunionForm` con todos los campos
- [ ] Implementar validación de campos requeridos
- [ ] Crear lista de reuniones con filtros (fecha, tipo, asistentes)
- [ ] Implementar CRUD completo de reuniones
- [ ] Vista detalle individual de reunión
- [ ] Añadir búsqueda de reuniones
- [ ] Implementar sistema de firmas digital/canvas
- [ ] Añadir recordatorios visuales

**Entregables:**
- CRUD de reuniones funcional
- Formulario validado
- Búsqueda y filtros operativos

---

### FASE 5: Páginas Libres (Semana 7)
**Objetivo:** Espacio flexible para contenido variado.

**Tareas:**
- [ ] Integrar Tiptap como editor de texto rico
- [ ] Configurar toolbar personalizado
- [ ] Implementar subida de imágenes (local + compresión)
- [ ] Crear componente de tablas personalizadas
- [ ] Sistema de categorización de notas
- [ ] Implementar búsqueda de contenido full-text
- [ ] Añadir systema de tags
- [ ] Crear plantillas (idea de proyecto, salida escolar, etc.)
- [ ] Implementar vista grid/lista de notas

**Entregables:**
- Editor rico funcional
- Soporte multimedia completo
- Sistema de organización de contenido

---

### FASE 6: Exportación e Impresión (Semana 8) ✅ COMPLETADA
**Objetivo:** Generación de documentos en múltiples formatos.

**Tareas:**
- [x] Implementar exportación a PDF por módulo (horarios, planificación, reuniones, notas)
- [ ] Crear estilos CSS @media print personalizados
- [ ] Añadir previsualización antes de exportar
- [ ] Implementar Web Share API para móviles
- [x] Exportación completa del cuaderno (todo en un PDF)
- [ ] Configurar encabezados y pies de página
- [ ] Añadir marca de agua opcional
- [x] Implementar sistema de backups (JSON import/export)

**Entregables:**
- [x] Exportación PDF funcional (`src/utils/pdf.tsx`, `src/utils/pdfTemplates.tsx`)
- [ ] Opción de impresión optimizada (pendiente CSS @media print)
- [ ] Compartir en móviles (Web Share API pendiente)
- [x] Sistema de backups (JSON import/export en `src/utils/export.ts`)

---

### FASE 7: PWA y Offline (Semana 9)
**Objetivo:** Experiencia offline completa.

**Tareas:**
- [ ] Configurar estrategias de cache (Cache First para static, Network First para API)
- [ ] Implementar Background Sync para cambios pendientes
- [ ] Añadir sistema de backup/restore automático
- [ ] Testing offline completo de todos los módulos
- [ ] Validar criterios de instalabilidad (Lighthouse PWA)
- [ ] Implementar actualizaciones automáticas de la app
- [ ] Añadir indicador de modo offline
- [ ] Configurar strategy de actualización de datos

**Entregables:**
- App 100% funcional offline
- Instalable en todos los dispositivos
- Sincronización transparente

---

### FASE 8: Testing y Polish (Semana 10-11)
**Objetivo:** Calidad, accesibilidad y experiencia de usuario.

**Tareas:**
- [x] Testing en móvil real (Android/iOS)
- [x] Testing en tablet
- [x] Testing en desktop (Windows/Mac/Linux)
- [ ] Corrección de bugs reportados
- [ ] **MEJORA VISUAL:** Rediseño UI/UX para apariencia más moderna y profesional
  - [ ] Diseñar nuevo sistema de colores y paleta
  - [ ] Mejorar tipografía y espaciado
  - [ ] Añadir animaciones y transiciones
  - [ ] Rediseñar componentes principales (tarjetas, formularios, botones)
  - [ ] Implementar dark mode
  - [ ] Añadir gradientes y sombras modernas
  - [ ] Mejorar iconografía
- [ ] Optimización de performance (Lighthouse 90+)
- [ ] Auditoría de accesibilidad WCAG AA
- [ ] Crear tutorial de uso onboarding
- [ ] Grabar video demo de la aplicación
- [ ] Escribir documentación para usuario final
- [ ] Preparar deployment

**NOTA IMPORTANTE:**
- **PENDIENTE:** Mejora visual de la interfaz. La funcionalidad está completa pero la apariencia requiere un rediseño para ser más moderna y profesional. Esto se abordará en una próxima sesión.

**Entregables:**
- App probada en todos los dispositivos
- Puntuación Lighthouse 90+
- Tutorial y documentación completos
- App lista para producción
- **Interfaz moderna y profesional**

---

### FASE 9: Asistente con IA Gratuita (Semana 12)
**Objetivo:** Integrar una API de IA gratuita para ayudar al docente en la creación y mejora de documentos.

**Tareas:**
- [ ] Investigar y seleccionar API de IA gratuita (Hugging Face, Groq, OpenRouter, etc.)
- [ ] Diseñar interfaz de asistente (chat flotante o panel lateral)
- [ ] Implementar integración con API seleccionada
- [ ] Crear prompts especializados para cada módulo:
  - [ ] **Horarios:** Sugerencias de distribución de asignaturas
  - [ ] **Planificación:** Ideas de actividades por nivel/asignatura
  - [ ] **Reuniones:** Generación de órdenes del día, resumen de acuerdos
  - [ ] **Notas:** Corrección ortográfica, mejora de redacción, ideas de contenido
- [ ] Añadir sistema de plantillas de prompts personalizables
- [ ] Implementar historial de conversación
- [ ] Configurar modo offline con mensajes informativos
- [ ] Añadir indicador de uso de créditos (si aplica)
- [ ] Implementar cache de respuestas para evitar repeticiones

**Opciones de APIs Gratuitas a Evaluar:**
- **Hugging Face Inference API** - Modelos de lenguaje gratuitos con límites razonables
- **Groq** - Inferencia ultrarrápida con modelos open-source (Llama 3, Mixtral)
- **OpenRouter** - Agregador que permite usar modelos con créditos gratuitos
- **Cohere** - Plan gratuito con límites diarios
- **Mistral AI** - API gratuita con límites de uso

**Entregables:**
- Asistente de IA integrado en la aplicación
- Prompts especializados funcionales para cada módulo
- Sistema de historial y cache
- Documentación de uso del asistente
- Validación de funcionamiento con API gratuita seleccionada

---

## Estructura del Proyecto

```
docenza/
├── .claude/
│   └── memory/               # Sistema de memoria persistente
├── public/
│   ├── icons/                # Iconos para PWA (maskable, any, etc)
│   ├── manifest.webmanifest # Manifiesto PWA
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/               # Componentes shadcn/ui (Button, Dialog, etc)
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Layout.tsx
│   │   ├── horario/
│   │   │   ├── HorarioTable.tsx
│   │   │   ├── CeldaEditDialog.tsx
│   │   │   └── HorarioManager.tsx
│   │   ├── calendario/
│   │   │   ├── CalendarioMensual.tsx
│   │   │   ├── VistaSemanal.tsx
│   │   │   ├── SemanaEditor.tsx
│   │   │   └── PeriodoCell.tsx
│   │   ├── reuniones/
│   │   │   ├── ReunionList.tsx
│   │   │   ├── ReunionForm.tsx
│   │   │   ├── ReunionDetail.tsx
│   │   │   └── FirmaCanvas.tsx
│   │   ├── notas/
│   │   │   ├── NotasList.tsx
│   │   │   ├── NotaEditor.tsx
│   │   │   ├── NotaCard.tsx
│   │   │   └── TiptapEditor.tsx
│   │   ├── export/
│   │   │   ├── ExportButton.tsx
│   │   │   ├── PreviewPDF.tsx
│   │   │   └── ShareButton.tsx
│   │   └── common/
│   │       ├── Loading.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   ├── stores/
│   │   ├── useCuadernoStore.ts  # Store principal
│   │   ├── useHorarioStore.ts
│   │   ├── useCalendarioStore.ts
│   │   ├── useReunionesStore.ts
│   │   └── useNotasStore.ts
│   ├── db/
│   │   ├── db.ts               # Configuración Dexie
│   │   ├── schema.ts           # Definición de tablas
│   │   └── migrations.ts       # Migraciones de DB
│   ├── types/
│   │   ├── index.ts            # Todos los tipos TypeScript
│   │   └── constants.ts        # Constantes (meses, horas, etc)
│   ├── utils/
│   │   ├── pdf.ts              # Utilidades de exportación PDF
│   │   ├── date.ts             # Utilidades de fechas
│   │   ├── storage.ts          # Utilidades de almacenamiento
│   │   └── validation.ts       # Esquemas Zod
│   ├── hooks/
│   │   ├── useIndexedDB.ts     # Hook personalizado para DB
│   │   ├── useOffline.ts       # Hook para detectar online/offline
│   │   └── useExport.ts        # Hook para exportación
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── CLAUDE.md                   # Este archivo
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── components.json             # Configuración shadcn/ui
```

---

## Comandos de Desarrollo

```bash
# Instalación de dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Formateo
npm run format
```

---

## Prioridades del Proyecto

### Must-Have (MVP)
1. Horarios editables (docente + alumnado)
2. Calendario mensual con expansión a semanal
3. Edición de periodos lectivos
4. Módulo de reuniones básico
5. Exportación a PDF
6. Funcionamiento offline

### Should-Have (Post-MVP)
1. Páginas libres con editor rico
2. Sistema de plantillas
3. Backup/restore
4. Búsqueda avanzada
5. Indicadores de progreso

### Could-Have (Futuro)
1. Sincronización cloud (opcional)
2. Colaboración entre docentes
3. Estadísticas de uso
4. Temas personalizables
5. Integración con calendarios externos
6. **Asistente con IA** (ver FASE 9)

---

## Principios de Diseño

1. **Offline-First:** La app debe funcionar completamente sin conexión
2. **Mobile-First:** Diseñar primero para móvil, luego escalar a desktop
3. **Progresivo:** Mejoras graduales, funcionalidad básica siempre disponible
4. **Accesible:** WCAG AA mínimo, preferible AAA
5. **Performante:** Lighthouse 90+ en todas las métricas
6. **Simple:** La curva de aprendizaje debe ser mínima para docentes no técnicos

---

## Consideraciones Especiales

### Calendario Escolar
- El año escolar comienza en septiembre, no en enero
- Debe haber configuración para fechas de inicio/fin
- Debe respetar festivos y vacaciones autonómicas

### Multi-dispositivo
- Responsive: móvil, tablet, desktop
- Touch-friendly: botones grandes, gestures donde procede
- PWA instalable en todos los platforms

### Privacidad
- Todo se guarda localmente, ningún servidor
- El usuario controla sus datos (exportación para backup)

---

## Testing Strategy

**Estado real (Agosto 2026):** E2E con Playwright instalado de verdad y con tests reutilizables en el repo (ver "FRAMEWORK DE TEST E2E CON PLAYWRIGHT" más arriba: `playwright.config.ts` + `e2e/*.spec.ts`, 11 tests, `npm run test:e2e`). Vitest y Chromatic siguen sin instalar.

- **Unit Testing:** Vitest para componentes y utilidades — ⏳ pendiente
- **E2E Testing:** Playwright para flujos críticos — ✅ instalado y con 11 tests (onboarding, navegación desktop/móvil, Horarios, Calendario, Reuniones, Notas, exportación PDF/JSON, offline)
- **Visual Regression:** Chromatic para componentes UI — ⏳ pendiente
- **Manual Testing:** Dispositivos reales (especialmente móviles) — sigue siendo necesario para PWA/instalación y gestos táctiles reales, que Playwright no puede cubrir del todo

---

## Deployment

Opción recomendada: **GitHub Pages** (gratuito y suficiente para PWA estática)

Alternativas:
- Vercel
- Netlify
- Servidor propio con nginx

---

## Referencias

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Vite PWA Plugin](https://vite-pwa-plugin.netlify.app/)
- [React Big Calendar](http://jquense.github.io/react-big-calendar/examples/)
- [Tiptap Editor](https://tiptap.dev/)
- [Dexie.js](https://dexie.org/)

## REGLA DE ORO

ANTES DE MODIFICAR CÓDIGO QUE FUNCIONA:
1. Entender qué hace el código existente
2. Identificar todas las dependencias y efectos colaterales
3. Ejecutar/prueba para confirmar el estado actual funciona
4. Explica lo justo, no expliques más de lo necesario.

DESPUÉS DE MODIFICAR:
1. Ejecutar/probar para verificar que lo que funcionaba sigue funcionando
2. Probar la nueva funcionalidad
3. No asumir que "cambia poco" significa "no rompe nada"