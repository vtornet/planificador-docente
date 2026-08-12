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
- **BOTÓN DE VOLVER EN LOS MODALES (PENDIENTE):** Los diálogos (`src/components/ui/dialog.tsx`) se cierran con click en el fondo, con Cancelar o con Escape, pero no hay un botón visible de cerrar/volver (ej. una X) en la cabecera del modal — poco intuitivo, sobre todo en móvil. Añadir un botón de cierre en `DialogHeader`/`DialogContent` (componente base, arregla todos los diálogos de la app a la vez).
- **CELDAS DE RECREO EDITABLES EN LOS CALENDARIOS (PENDIENTE):** Confirmado en el código: `esRecreo` en las filas de periodos solo se usa para mostrar "☕ Recreo" en la columna de la hora, pero las celdas de cada día de esa fila siguen siendo editables como cualquier otra, sin distinguirse visualmente. Afecta a `VistaSemanal.tsx` y `SemanaEditor.tsx` (Calendario). En `HorarioTable.tsx` (Horarios) ya no aplica del todo tras el cambio de abajo (las celdas de recreo abren igualmente el diálogo de asignatura, cosa que tampoco debería pasar). Hace falta: 1) deshabilitar la edición de esas celdas cuando `periodo.esRecreo` sea `true`, 2) darles un color de relleno distinto (ej. `bg-muted` o similar) para diferenciarlas de las celdas normales.
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
- **COLORES DE ASIGNATURA EN EL PDF (PENDIENTE, resultado contradictorio):** Se implementó (`backgroundColor`/`color` por celda en `HorarioPDFDocument` según `celda.color`, valores hex en `PALETA_ASIGNATURAS`) y se verificó técnicamente con `pdfjs-dist` extrayendo los operadores de color del PDF generado — los valores RGB coincidían byte a byte con los hex esperados. **Pero el usuario, probando el PDF real, dice que no ve los colores.** Queda pendiente investigar la causa de esta contradicción antes de dar el tema por cerrado; posibles pistas para la próxima sesión:
  - Diferencia entre "el color está en el archivo" (confirmado) y "el visor/impresora lo muestra" — muchos visores de PDF y, sobre todo, la impresión, tienen una opción "Imprimir gráficos de fondo" desactivada por defecto que oculta `backgroundColor`.
  - Probar abriendo el PDF exportado de verdad (no solo inspeccionar sus bytes) en varios visores (Adobe Reader, visor de Chrome, Vista previa de macOS, el que use el docente) antes de dar por buena cualquier corrección futura.
  - Revisar si el color se pierde específicamente al exportar desde el navegador de la docente (¿qué navegador/SO usa?) o si es un problema de todos los casos.
  - Las notas de cada celda (ver punto siguiente) sí se confirmaron visibles por el usuario, así que el problema parece específico del color, no de la exportación en general.
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
  - **Notificaciones de avisos de tareas de la agenda.** Módulo Calendario/Planificación (`Semana`/`DiaPlanificacion`/`Periodo`). Pendiente de definir: ¿notificaciones push del navegador (requiere permiso + Service Worker, ya hay uno por la PWA), recordatorios in-app al abrir la app, o ambos? ¿Sobre qué avisan exactamente (periodos con contenido pendiente, reuniones próximas, fechas concretas)?
  - **Festivos en horarios y agenda.** El modelo de datos ya existe (`Configuracion.festivos: Date[]` y `.vacaciones: Vacacion[]`) y `CalendarioMensual.tsx` ya los lee y pinta como eventos — pero **no hay ninguna pantalla para añadirlos**, así que esos arrays están siempre vacíos en la práctica. Además, aunque se pudieran añadir, ni `HorarioTable.tsx` ni la vista de Semanas de Horarios tienen en cuenta si un día es festivo (a diferencia del recreo, que sí se distingue — aunque tampoco se ha bloqueado su edición, ver pendiente de recreo más arriba). Haría falta: 1) UI para gestionar festivos/vacaciones (¿en Perfil? ¿en Calendario?), 2) que Horarios y Calendario los reflejen visualmente y, probablemente, no dejen editar contenido en días festivos. **Dato disponible:** el usuario compartió un calendario escolar oficial real (Andalucía, Huelva, LEPE, curso 2026-2027) con fechas concretas de festivos/vacaciones — guardado en la memoria persistente del proyecto (`festivos_calendario_lepe_2026_27.md`), útil como caso de prueba o plantilla cuando se aborde esta feature.
- **REBRANDING A "DOCENZA":** ✅ Hecho (Agosto 2026). La app pasó a llamarse **Docenza** (antes "Plafinicador Docente"), con el logo real proporcionado por el usuario en la carpeta `Logos/` (imágenes generadas, no vectoriales). Cambios aplicados:
  - Copiados a `src/assets/`: `docenza-logo.png` (logo completo con texto, fondo transparente) y `docenza-icon.png` (solo el icono/glifo "D", fondo transparente) — usados con `import` de Vite, no en `public/` porque no son assets sueltos que deban servirse por URL directa.
  - **Favicon y iconos PWA regenerados** a partir de `Logos/Sin texto.png` (pedido explícito del usuario) con un script Python/Pillow: `public/favicon.ico` (multi-tamaño 16/32/48/64), `public/favicon-256.png` (usado como `<link rel="icon">` principal en `index.html`, PNG en vez de SVG porque no había versión vectorial), `public/icons/icon-192x192.png`, `icon-512x512.png` (fondo transparente, con padding), `icon-maskable-512x512.png` (fondo azul `#3b82f6` a sangre completa — el mismo `theme_color` de la app — con el glifo al 62% para respetar la zona segura de máscara) y `public/icons/apple-touch-icon.png` (180×180, nuevo, no existía antes — iOS no soporta fondo transparente en el icono de inicio, así que lleva el mismo fondo azul que el maskable). Se eliminó `public/favicon.svg` (el icono "D" genérico de antes, ya no se usa).
  - `index.html` (`<title>`, meta description, favicon), `vite.config.ts` (manifest PWA: `name`/`short_name`/`description`), `package.json` y `package-lock.json` (campo `name`), `src/App.tsx` (pantalla de onboarding: logo en vez de emoji, título "Docenza"), `src/components/layout/Sidebar.tsx` (logo e nombre en el panel lateral de escritorio), `src/components/export/ImportDialog.tsx` (mensaje de error), `src/utils/export.ts` y `src/utils/pdf.tsx` (prefijo de los nombres de archivo exportados: `docenza-...` en vez de `plafinicador-...`) y los comentarios de cabecera de `src/types/index.ts` y `src/types/constants.ts`.
  - **Decisión deliberada, sin cambiar:** el nombre interno de la base de datos IndexedDB (`PlafinicadorDB`, en `src/db/db.ts` y la constante sin usar `DB_NAME` de `constants.ts`) **no se ha tocado**. Ese nombre nunca es visible para el usuario, pero SÍ es la clave real bajo la que el navegador guarda los datos — renombrarlo habría creado una base de datos nueva y vacía, perdiendo (a ojos de la app) todos los datos ya guardados por la docente que está probando la app. Si en el futuro se quiere renombrar por limpieza, hace falta una migración explícita (abrir la DB vieja, copiar todo a una `DocenzaDB` nueva, y solo entonces borrar la vieja), no un simple cambio de string.
  - **Pendiente, no pedido esta vez:** el repositorio de GitHub y la URL de GitHub Pages siguen en `planificador-docente` (`vite.config.ts` → `base`, y el remoto `origin`) — no se ha tocado porque cambiar el nombre del repo/URL es una decisión aparte (rompe cualquier enlace ya compartido a la PWA) y no se pidió explícitamente.

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

**Estado real:** no hay ningún framework de testing instalado todavía (sin Vitest, Playwright ni Chromatic en `package.json`). Lo de abajo es la estrategia planificada para Fase 8, pendiente de implementar.

- **Unit Testing:** Vitest para componentes y utilidades
- **E2E Testing:** Playwright para flujos críticos
- **Visual Regression:** Chromatic para componentes UI
- **Manual Testing:** Dispositivos reales (especialmente móviles) — esto es lo único hecho hasta ahora

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