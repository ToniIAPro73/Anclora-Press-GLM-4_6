# Anclora Press MVP Roadmap
## Word to PDF Perfect Fidelity Implementation

**Última actualización:** Diciembre 13, 2025
**Versión:** 1.0
**Objetivo Principal:** Crear un MVP capaz de ingerir un documento Word y generar un PDF con fidelidad perfecta usando Paged.js, demostrando superioridad sobre Atticus.

---

## 1. Visión General del MVP

### Hipótesis Central
- Atticus está fallando en fidelidad de exportación PDF (márgenes invertidos, páginas en blanco, TOC rotos)
- Anclora Press puede resolver esto usando Paged.js (CSS estándar W3C) para unificar el motor de renderizado
- Esto requiere: importación semántica (Mammoth.js) → edición estructurada (Tiptap) → exportación perfecta (Paged.js)

### Entregables del MVP
1. ✅ Importador DOCX con mapeo semántico de estilos
2. ✅ Editor visual minimalista (Tiptap)
3. ✅ Vista de previsualización WYSIWYG con Paged.js
4. ✅ Exportación PDF perfecto (100% fidelidad pantalla-impresión)
5. ✅ Local-First persistence (IndexedDB) para confiabilidad

---

## 2. Arquitectura Técnica

### Stack Tecnológico Seleccionado

```
Frontend:
├─ Next.js 15 (App Router) - ✅ Ya existe
├─ React 18+ - ✅ Ya existe
├─ TypeScript - ✅ Ya existe
├─ Tailwind CSS 4 - ✅ Ya existe
├─ shadcn/ui (50+ componentes) - ✅ Ya existe
│
Edición de Contenido:
├─ Tiptap (Editor de texto semántico) - 🔄 NUEVO
├─ ProseMirror (subyacente) - 🔄 NUEVO
├─ Y.js + Hocuspocus (CRDT para colaboración futura) - 🔄 NUEVO
│
Importación:
├─ Mammoth.js (conversión DOCX → HTML semántico) - ✅ Instalado
│
Exportación:
├─ Paged.js (paginación CSS → PDF) - 🔄 NUEVO
├─ html2pdf / PrintJS (backup) - 🔄 NUEVO
│
Persistencia:
├─ IndexedDB (Local-First) - 🔄 NUEVO
├─ RxDB (opcional, si necesita sync) - 🔄 NUEVO
└─ Prisma + SQLite (Backend) - ✅ Ya existe

IA (Opcional):
├─ GLM-4-Flash (corrección, sugerencias) - 🔄 FUTURO
└─ Anthropic/OpenAI (alternativa) - 🔄 FUTURO
```

---

## 3. Plan de Ejecución Fase por Fase

### FASE 0: Preparación y Seguridad (Semana 1)

#### 0.1 Seguridad en APIs - CRÍTICO
**Objetivo:** Proteger endpoints y validar autenticación

**Tareas:**
- [ ] Auditar todos los endpoints en `/api/*`
- [ ] Implementar middleware de autenticación con NextAuth
- [ ] Validar que solo el propietario acceda a sus libros
- [ ] Implementar rate limiting en `/api/import`
- [ ] Validar y sanitizar inputs DOCX

**Archivos a modificar:**
- `src/app/api/import/route.ts` - Agregar autenticación
- `src/middleware.ts` - Crear si no existe
- `src/lib/auth.ts` - Configuración auth

**Esfuerzo:** 6-8 horas
**DL:** Fin de semana

#### 0.2 Configuración de Ambiente
**Tareas:**
- [ ] Instalar dependencias principales:
  ```bash
  npm install tiptap @tiptap/pm @tiptap/extension-*
  npm install pagedjs pagedjs-cli
  npm install rxdb idb
  ```
- [ ] Configurar variables de entorno para IA (GLM-4 si aplica)
- [ ] Verificar Mammoth.js ya instalado

**Esfuerzo:** 2-3 horas

---

### FASE 1: Núcleo Importación-Edición-Exportación (Semanas 2-3)

#### 1.1 Mejorar Pipeline de Importación DOCX
**Estado Actual:** `/api/import` exists pero conversión es básica
**Objetivo:** Importación semántica con mapeo de estilos

**Tareas:**
- [ ] Crear componente `DocumentImporter` que:
  - Acepte .docx
  - Use Mammoth.js para convertir a HTML semántico
  - Mapee estilos Word → estilos Anclora (Título 1 → h1, etc.)
  - Valide estructura (máx 100 páginas, 50MB)

- [ ] UI para "Mapeo de Estilos":
  - "¿Estilo Personalizado 1 equivale a Cita?"
  - Vista previa en tiempo real
  - Confirmación antes de importar

- [ ] Crear endpoint mejorado:
  ```typescript
  POST /api/import
  Body: FormData { docx file }
  Response: {
    title: string
    content: string (HTML semántico)
    metadata: { author, pages, etc }
    preview: { firstPage }
  }
  ```

**Archivos:**
- `src/app/api/import/route.ts` - Mejorar lógica
- `src/components/document-importer.tsx` - NUEVO
- `src/lib/mammoth-semantic.ts` - NUEVO (helper)

**Esfuerzo:** 12-16 horas

#### 1.2 Implementar Editor Tiptap
**Estado Actual:** MDXEditor básico exists
**Objetivo:** Editor minimalista Tiptap con control semántico

**Tareas:**
- [ ] Crear componente `TiptapEditor`:
  ```typescript
  // Features
  - Bold, Italic, Underline
  - Headings (H1-H6)
  - Paragraph
  - Blockquote
  - Lists (bullet, ordered)
  - HardBreak
  - SceneBreak (custom node) ⭐
  - PageBreak (custom node) ⭐
  ```

- [ ] Custom Nodes:
  ```typescript
  // SceneBreak: renderiza como ✧ (ornament)
  <SceneBreak /> en JSON → ✧ en vista

  // PageBreak: fuerza salto de página en PDF
  <PageBreak /> → CSS break-before: page
  ```

- [ ] Barra de herramientas minimalista (estilo Notion/Medium)
- [ ] Atajo de teclado: Cmd+K para slash commands
- [ ] Auto-guardado cada 5 segundos

**Archivos:**
- `src/components/tiptap-editor.tsx` - NUEVO
- `src/lib/tiptap-extensions.ts` - NUEVO (custom nodes)

**Esfuerzo:** 16-20 horas

#### 1.3 Implementar Paged.js para Previsualización
**Objetivo:** Vista WYSIWYG que replica exactamente lo que imprimirá

**Tareas:**
- [ ] Crear componente `PagedPreview`:
  ```typescript
  - Inyecta contenido Tiptap en iframe
  - Aplica CSS de Paged.js
  - Configura dimensiones (6x9", A4, custom)
  - Renderiza página por página
  ```

- [ ] Sistema de Temas CSS:
  ```css
  --font-body: "Libre Baskerville"
  --font-header: "JetBrains Mono"
  --margin-outer: 0.75in
  --margin-inner: 1in
  --line-height: 1.5
  --widows: 1
  --orphans: 1
  ```

- [ ] Controles de Usuario:
  - Zoom (50-200%)
  - Número de páginas
  - Márgenes ajustables (UI slider)
  - Preview en columnas (1, 2 páginas)

**Archivos:**
- `src/components/paged-preview.tsx` - NUEVO
- `src/styles/paged-print.css` - NUEVO
- `src/lib/paged-theme-manager.ts` - NUEVO

**Esfuerzo:** 14-18 horas

#### 1.4 Exportación PDF Perfecta
**Objetivo:** PDF que coincida 100% con la previsualización

**Tareas:**
- [ ] Crear función `exportToPDF`:
  ```typescript
  // Opción 1: Window.print() desde Paged.js iframe
  // Opción 2: Paged.js generador CLI (node)
  // Opción 3: Puppeteer + Paged.js (backend)

  // Recomendado: Option 1 (más simple, cliente)
  const pdf = await window.print()
  ```

- [ ] Configurar encabezados/pies vivos:
  ```css
  @page {
    margin: var(--margin-outer) var(--margin-inner);

    @top-center {
      content: string(chapter-title);
    }

    @bottom-center {
      content: counter(page);
    }
  }
  ```

- [ ] Control de huérfanas/viudas:
  ```css
  p {
    orphans: 2;
    widows: 2;
    break-inside: avoid;
  }
  ```

- [ ] Metadata en PDF (Title, Author, CreationDate)

**Archivos:**
- `src/lib/pdf-export.ts` - NUEVO
- `src/components/export-dialog.tsx` - Mejorar existente

**Esfuerzo:** 10-12 horas

#### 1.5 Local-First Persistence
**Objetivo:** Garantizar que ningún cambio se pierda por desconexión

**Tareas:**
- [ ] Configurar IndexedDB:
  ```typescript
  // Estructura
  - Books (id, title, content, updatedAt)
  - Chapters (id, bookId, content, order)
  - Drafts (id, bookId, content, autosaveAt)
  ```

- [ ] Hook `useLocalStorage`:
  ```typescript
  - Auto-save en IndexedDB cada keystroke
  - Sync con servidor en background
  - Merge de conflictos si hay desconexión
  ```

- [ ] Recuperación en caso de caída:
  ```typescript
  - Detectar cambios no sincronizados
  - Mostrar notificación: "cambios pendientes"
  - Opción de forcibly push al servidor
  ```

**Archivos:**
- `src/hooks/use-local-persistence.ts` - NUEVO
- `src/lib/indexeddb-manager.ts` - NUEVO
- `src/db/schema-local.ts` - NUEVO (IndexedDB schema)

**Esfuerzo:** 12-14 horas

---

### FASE 2: Testing y Validación (Semana 4)

#### 2.1 Suite de Tests para MVP
**Tareas:**
- [ ] Importación: DOCX válido → HTML semántico correcto
- [ ] Editor: Contenido guardado → recuperado idénticamente
- [ ] Exportación: Pantalla Paged.js → PDF byte-to-byte igual
- [ ] Persistencia: Cambios sobreviven offline/crash

**Framework:** Jest + React Testing Library

**Esfuerzo:** 10-12 horas

#### 2.2 Validación con Usuario Real
**Tareas:**
- [ ] Seleccionar 3-5 usuarios beta
- [ ] Proporcionarles documentos Word complejos
- [ ] Recopilar feedback:
  - ¿Se importó correctamente?
  - ¿Fidelidad PDF es mejor que Atticus?
  - ¿Velocidad aceptable?

**Esfuerzo:** 8-10 horas (incluye feedback gathering)

---

## 4. Componentes a Modificar / Crear

### Existentes (Requieren Mejora)
- `src/app/api/import/route.ts` - Agregar semántica
- `src/components/text-editor.tsx` - Reemplazar con Tiptap
- `src/components/export-modal.tsx` - Integrar Paged.js

### Nuevos (Crear)
- `src/components/tiptap-editor.tsx` - Editor principal
- `src/components/paged-preview.tsx` - Vista WYSIWYG
- `src/components/document-importer.tsx` - UI importación
- `src/lib/tiptap-extensions.ts` - Custom nodes
- `src/lib/paged-theme-manager.ts` - Gestión temas CSS
- `src/lib/pdf-export.ts` - Exportación
- `src/lib/indexeddb-manager.ts` - Persistencia local
- `src/hooks/use-local-persistence.ts` - Hook de persistencia
- `src/db/schema-local.ts` - IndexedDB schema
- `src/styles/paged-print.css` - Estilos Paged.js

---

## 5. Tecnologías a Instalar

```bash
# Editor de Texto Semántico
npm install @tiptap/react @tiptap/pm @tiptap/extension-character-count
npm install @tiptap/extension-heading @tiptap/extension-bold
npm install @tiptap/extension-italic @tiptap/extension-underline
npm install @tiptap/extension-paragraph @tiptap/extension-blockquote
npm install @tiptap/extension-bullet-list @tiptap/extension-ordered-list
npm install @tiptap/extension-list-item @tiptap/extension-hard-break
npm install @tiptap/extension-placeholder @tiptap/extension-history

# Paginación y PDF
npm install pagedjs pagedjs-dist

# Persistencia Local-First
npm install idb rxdb

# Utilidades
npm install clsx tailwind-merge

# Testing (para Phase 2)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @playwright/test
```

---

## 6. Criterios de Aceptación del MVP

### Importación
- [ ] DOCX con hasta 100 páginas importa en <5 segundos
- [ ] Estilos Word (Título 1, Normal, Cita) mapean correctamente
- [ ] Imágenes inline se conservan
- [ ] Preview previsualiza primeras 3 páginas

### Edición
- [ ] Escritura sin lag (keypresses < 100ms latencia)
- [ ] Markdown shortcuts funcionan (##, -, *, etc.)
- [ ] Cambios se guardan automáticamente cada 5 seg
- [ ] Historial deshacer/rehacer funciona

### Exportación PDF
- [ ] PDF visual = Previsualización Paged.js (100% fidelidad)
- [ ] Márgenes correctos (sin inversiones)
- [ ] Encabezados/pies vivos funciona
- [ ] Huérfanas/viudas controladas
- [ ] TOC actualiza automáticamente
- [ ] Metadata correcto (Title, Author)

### Persistencia
- [ ] Cambios persisten en IndexedDB offline
- [ ] Si servidor no responde, usuario ve notificación
- [ ] Sync automático cuando vuelva conexión
- [ ] Sin pérdida de datos en crash del navegador

---

## 7. Timeline Estimado

```
Semana 1 (Dec 13-19):
├─ Lunes-Miércoles: Seguridad (Phase 0.1) - 6h
├─ Miércoles-Viernes: Setup + Importación básica (Phase 1.1) - 12h
└─ Validación: npm build, deploy a staging

Semana 2 (Dec 20-26):
├─ Lunes-Miércoles: Editor Tiptap (Phase 1.2) - 16h
├─ Jueves-Viernes: Paged.js Preview (Phase 1.3) - 12h
└─ Validación: Testing manual

Semana 3 (Dec 27-Jan 2):
├─ Lunes-Miércoles: PDF Export (Phase 1.4) - 10h
├─ Jueves-Viernes: Local-First (Phase 1.5) - 12h
└─ Validación: User testing setup

Semana 4 (Jan 3-9):
├─ Lunes-Miércoles: Testing suite (Phase 2.1) - 10h
├─ Jueves-Viernes: User validation (Phase 2.2) - 8h
└─ MVP LISTO PARA LAUNCH
```

**Esfuerzo Total Estimado:** 120-140 horas (~3-4 semanas a tiempo completo)

---

## 8. Success Metrics (How We Know It Works)

### Técnicas
- ✅ PDF exportado ≠ Atticus PDFs (100% fidelidad vs. sus márgenes invertidos)
- ✅ Zero data loss en offline scenarios
- ✅ <100ms latency en keypresses
- ✅ First export < 5 segundos

### De Usuario
- ✅ "La fidelidad es perfecta"
- ✅ "Es más rápido que Atticus"
- ✅ "Confío en que no perderé datos"
- ✅ "La importación preservó mi formato"

### De Negocio
- ✅ 3-5 usuarios beta satisfechos
- ✅ Feedback positivo vs. Atticus
- ✅ Listo para Early Access launch

---

## 9. Riesgos y Mitigación

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Paged.js tiene bugs con fuentes custom | Media | Usar Google Fonts (probadas) |
| IndexedDB tiene límite de storage | Baja | Comprimir documentos grandes |
| Tiptap tiene curva aprendizaje | Media | Usar ejemplos oficiales, doc clara |
| Performance con docs masivos (500+ págs) | Alta | Virtualización, lazy loading |
| Integración DOCX → Tiptap JSON compleja | Media | Usar Mammoth bien, parser custom |

---

## 10. Próximos Pasos (Inmediatos)

1. **HOY:** Revisión y aprobación de este roadmap
2. **Mañana:** Iniciar Phase 0.1 (Seguridad)
3. **Viernes:** Completar Phase 0 + comenzar Phase 1.1

---

**Documento preparado para ejecución inmediata**
**Versión:** 1.0 - Ready to implement
**Aprobado:** Pendiente de confirmación del usuario
