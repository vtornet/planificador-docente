# Plafinicador Docente - Planificador Digital para Docentes

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
- **ASIGNATURAS PREDEFINIDAS EN HORARIOS:** ✅ Hecho (Agosto 2026). Click en una celda de `HorarioTable.tsx` abre `CeldaHorarioDialog.tsx` con: desplegable de asignaturas predefinidas (`ASIGNATURAS_PREDEFINIDAS` en `src/types/constants.ts`: Lengua, Matemáticas, Conocimiento del Medio, Atención Educativa, Plástica, Música, Inglés, Francés, Portugués, Religión, Educación Física, Valores Sociales y Cívicos), opción "Otra (personalizada)..." que revela un campo de texto libre, y un campo de Nota. Se añadió `nota?: string` a `CeldaHorario` (`src/types/index.ts`). La celda muestra la asignatura y, si hay nota, un icono + texto pequeño debajo (truncado, con `title` para verla completa al pasar el ratón). Solo implementado en Horarios (no en Calendario/planificación semanal, que es contenido más libre, no basado en asignaturas fijas).

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
plafinicador-docente/
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