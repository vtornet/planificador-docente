# Plafinicador Docente - Planificador Digital para Docentes

## Visión General

Aplicación web progresiva (PWA) que permite a los docentes gestionar su planificación escolar de forma digital, similar a un cuaderno físico pero con las ventajas de lo digital: edición, exportación a PDF, sincronización y acceso multi-dispositivo.

**Problema a resolver:** Los docentes utilizan cuadernos físicos de planificación que no permiten edición fácil, búsqueda, copias de seguridad o acceso desde múltiples dispositivos.

**Solución:** Una PWA offline-first que replica la experiencia del cuaderno físico con capacidades digitales.

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
- **React Hook Form + Zod** - Formularios con validación

### Calendario
- **React Big Calendar** - Calendario interactivo personalizable
- **date-fns** - Utilidades para manejo de fechas (calendario escolar septiembre-agosto)

### Exportación
- **react-pdf / @react-pdf/renderer** - Generación de PDFs programática
- **html2pdf.js** - Exportación directa del DOM a PDF

### PWA
- **Vite PWA Plugin (vite-plugin-pwa)** - Service workers y manifest automáticos
- **Workbox** - Estrategias de cache y sincronización

### Editor Rico
- **Tiptap** - Editor de texto rico basado en ProseMirror
  - Soporte para tablas, imágenes, listas, etc.

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

### FASE 6: Exportación e Impresión (Semana 8)
**Objetivo:** Generación de documentos en múltiples formatos.

**Tareas:**
- [ ] Implementar exportación a PDF por módulo
- [ ] Crear estilos CSS @media print personalizados
- [ ] Añadir previsualización antes de exportar
- [ ] Implementar Web Share API para móviles
- [ ] Exportación completa del cuaderno (todo en un PDF)
- [ ] Configurar encabezados y pies de página
- [ ] Añadir marca de agua opcional
- [ ] Implementar sistema de backups (JSON import/export)

**Entregables:**
- Exportación PDF funcional
- Opción de impresión optimizada
- Compartir en móviles
- Sistema de backups

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
- [ ] Testing en móvil real (Android/iOS)
- [ ] Testing en tablet
- [ ] Testing en desktop (Windows/Mac/Linux)
- [ ] Corrección de bugs reportados
- [ ] Optimización de performance (Lighthouse 90+)
- [ ] Auditoría de accesibilidad WCAG AA
- [ ] Crear tutorial de uso onboarding
- [ ] Grabar video demo de la aplicación
- [ ] Escribir documentación para usuario final
- [ ] Preparar deployment

**Entregables:**
- App probada en todos los dispositivos
- Puntuación Lighthouse 90+
- Tutorial y documentación completos
- App lista para producción

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

- **Unit Testing:** Vitest para componentes y utilidades
- **E2E Testing:** Playwright para flujos críticos
- **Visual Regression:** Chromatic para componentes UI
- **Manual Testing:** Dispositivos reales (especialmente móviles)

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