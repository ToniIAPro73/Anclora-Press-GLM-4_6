# Análisis de Refactorización - Anclora Press

## 1. ESTADO ACTUAL DE LA APLICACIÓN

### 1.1 Tecnología Base
- **Framework:** Next.js 15 con React 19
- **Styling:** Tailwind CSS 4 con componentes Radix UI
- **Editor:** Tiptap (ProseMirror) para edición semántica
- **Base de Datos:** Prisma ORM
- **Autenticación:** NextAuth.js

### 1.2 Paleta de Colores Actual
```
Primario: #0088a0 (Turquesa)
Secundario: #283b48 (Azul oscuro)
Acentos: #80ED99 (Verde menta), #D6BFA2 (Arena)
```

### 1.3 Módulos Principales
1. **Editor de Texto:** EnhancedTextEditor, TextEditor
2. **Gestor de Capítulos:** ChapterEditor, ChapterOrganizer
3. **Diseño de Portadas:** CoverEditor, BackCoverEditor
4. **Importación de Documentos:** DocumentImporter (DOCX, PDF, TXT, MD)
5. **Exportación:** ExportModal, PDFExportDialog, PagedPreview
6. **IA:** AICopilot (integración GLM-4)
7. **Colaboración:** CollaborationPanel
8. **Navegación:** FloatingNavigator

---

## 2. ANÁLISIS DE IMPORTACIÓN DE DOCUMENTOS

### 2.1 Estado Actual
**Ubicación:** `/src/app/api/import/route.ts`

**Formatos Soportados:**
- ✅ DOCX (con Mammoth.js - semántico)
- ✅ PDF (con Pandoc + fallback ligero)
- ✅ TXT/MD (conversión directa)
- ✅ DOC, RTF, ODT, EPUB (con Pandoc)

**Librerías Utilizadas:**
- `mammoth.js` - Importación semántica DOCX
- `pandoc-bin` - Conversión universal
- `node-pandoc` - Wrapper Node.js
- Extractor PDF ligero personalizado

### 2.2 Problemas Identificados

#### Problema 1: Extracción de PDF Incompleta
- **Síntoma:** PDFs complejos pierden estructura y formato
- **Causa:** Pandoc no siempre preserva capítulos/subcapítulos
- **Ubicación:** `/src/lib/pdf-text-extractor.ts`

#### Problema 2: Preservación Semántica Limitada en PDF
- **Síntoma:** Listas, citas y enlaces no se preservan correctamente
- **Causa:** Fallback a extracción de texto plano
- **Impacto:** Pérdida de estructura editorial

#### Problema 3: Degradación de Formato en Conversión
- **Síntoma:** Imágenes incrustadas no se importan
- **Causa:** Limitación de Pandoc en conversión HTML
- **Nota:** Por ahora no se requiere soporte OCR

### 2.3 Soluciones Propuestas

#### Solución 1: Mejorar Extracción PDF
- Implementar `pdfjs-dist` para mejor análisis de estructura
- Detectar automáticamente capítulos por tamaño de fuente
- Preservar metadatos de PDF (autor, título, etc.)

#### Solución 2: Preservación Semántica Mejorada
- Mantener estructura de listas (ul/ol)
- Preservar citas (blockquote)
- Mantener enlaces internos
- Detectar y preservar notas al pie

#### Solución 3: Validación de Integridad
- Verificar que contenido importado no esté vacío
- Validar estructura de capítulos
- Reportar advertencias de pérdida de formato

---

## 3. NUEVA PALETA DE COLORES - PALETA 2 (NÁUTICA ELEGANTE)

### 3.1 Colores Base
```
Navy (Azul Marino):     #083A4F (HEX) / RGB(8, 58, 79)
Gold (Oro):             #A8BD66 (HEX) / RGB(168, 189, 102)
Aqua (Agua):            #C0D5D6 (HEX) / RGB(192, 213, 214)
Teal (Verde Azulado):   #407E8C (HEX) / RGB(64, 126, 140)
Sand (Arena):           #E5E1DD (HEX) / RGB(229, 225, 221)
```

### 3.2 Paleta Extendida con Degradados Sutiles

#### Tema Claro
```
Background Principal:    #FFFFFF (Blanco puro)
Background Secundario:   #F8F9FA (Gris muy claro)
Degradado Sutil:         Linear(135deg, #F8F9FA → #E5E1DD)

Texto Principal:         #083A4F (Navy)
Texto Secundario:        #407E8C (Teal)
Texto Terciario:         #666666 (Gris neutro)

Primario (Botones):      #083A4F (Navy)
Primario Hover:          Linear(135deg, #083A4F → #0A4A63)

Secundario (Acentos):    #A8BD66 (Gold)
Secundario Hover:        Linear(135deg, #A8BD66 → #9DAE5C)

Acento Terciario:        #407E8C (Teal)
Acento Hover:            Linear(135deg, #407E8C → #4A92A0)

Bordes:                  #D1D5DB (Gris suave)
Input Background:        #F3F4F6 (Gris muy claro)
```

#### Tema Oscuro
```
Background Principal:    #0F1419 (Negro muy oscuro)
Background Secundario:   #1A2332 (Azul muy oscuro)
Degradado Sutil:         Linear(135deg, #1A2332 → #0F1419)

Texto Principal:         #E5E1DD (Arena clara)
Texto Secundario:        #A8BD66 (Gold)
Texto Terciario:         #B0B8C0 (Gris claro)

Primario (Botones):      #A8BD66 (Gold)
Primario Hover:          Linear(135deg, #A8BD66 → #B8CD76)

Secundario (Acentos):    #407E8C (Teal)
Secundario Hover:        Linear(135deg, #407E8C → #5A9EAC)

Acento Terciario:        #083A4F (Navy)
Acento Hover:            Linear(135deg, #083A4F → #0A5A7F)

Bordes:                  #3D4D58 (Gris azulado oscuro)
Input Background:        #1A2332 (Azul muy oscuro)
```

### 3.3 Degradados Estratégicos

#### Degradados Principales (Sutiles)
```
Degradado Primario:      Linear(135deg, #083A4F 0%, #0A4A63 100%)
Degradado Secundario:    Linear(135deg, #A8BD66 0%, #9DAE5C 100%)
Degradado Terciario:     Linear(135deg, #407E8C 0%, #4A92A0 100%)
Degradado Fondo:         Linear(135deg, #F8F9FA 0%, #E5E1DD 100%)
```

#### Degradados Oscuros
```
Degradado Primario Oscuro:   Linear(135deg, #1A2332 0%, #0F1419 100%)
Degradado Secundario Oscuro: Linear(135deg, #A8BD66 0%, #8FA852 100%)
Degradado Terciario Oscuro:  Linear(135deg, #407E8C 0%, #2F5F6F 100%)
```

---

## 4. APLICACIÓN DE DEGRADADOS ELEGANTES

### 4.1 Ubicaciones Estratégicas

#### Fondos y Superficies
- **Header Principal:** Degradado Navy → Navy más claro
- **Sidebar:** Degradado sutil Fondo
- **Cards Principales:** Degradado muy sutil (casi imperceptible)
- **Secciones Destacadas:** Degradado Gold/Teal según contexto

#### Elementos Interactivos
- **Botones Primarios:** Degradado Navy con hover más pronunciado
- **Botones Secundarios:** Degradado Gold con hover
- **Botones Terciarios:** Degradado Teal con hover
- **Links:** Sin degradado, solo color sólido con hover suave

#### Decorativos
- **Líneas Divisoras:** Degradado horizontal sutil (fade in/out)
- **Bordes de Tarjetas:** Degradado vertical sutil
- **Fondos de Secciones:** Degradado muy ligero para profundidad

### 4.2 Armonía y Elegancia
- Todos los degradados usan ángulo 135° (diagonal sutil)
- Variación de color máxima: 10-15% para mantener sutileza
- Transiciones suaves en modo hover
- Consistencia visual entre temas claro y oscuro

---

## 5. PLAN DE IMPLEMENTACIÓN

### Fase 1: Refactorización de Temas (ACTUAL)
- [ ] Actualizar `globals.css` con nueva paleta
- [ ] Actualizar `tailwind.config.ts` con colores y degradados
- [ ] Crear utilidades CSS para degradados
- [ ] Verificar contraste WCAG AA en todos los modos

### Fase 2: Mejora de Importación de Documentos
- [ ] Implementar mejor extracción PDF con pdfjs-dist
- [ ] Mejorar preservación de estructura (capítulos, listas, citas)
- [ ] Agregar validación de integridad
- [ ] Pruebas con múltiples formatos

### Fase 3: Actualización de Componentes
- [ ] Revisar y actualizar componentes principales
- [ ] Aplicar nuevos colores y degradados
- [ ] Verificar accesibilidad en todos los modos
- [ ] Pruebas de contraste

### Fase 4: Validación y Pruebas
- [ ] Pruebas visuales en modo claro y oscuro
- [ ] Pruebas de importación de documentos
- [ ] Validación de accesibilidad
- [ ] Pruebas de rendimiento

---

## 6. NOTAS IMPORTANTES

### Preservación de Funcionalidad
- Todos los módulos existentes se mantienen
- Cambios son principalmente visuales (CSS/colores)
- API de importación se mejora pero mantiene compatibilidad
- Estructura de componentes se preserva

### Consideraciones de Accesibilidad
- Contraste mínimo WCAG AA (4.5:1 para texto)
- Degradados no interfieren con legibilidad
- Modo oscuro mantiene misma elegancia
- Todos los botones e iconos claramente distinguibles

### Rendimiento
- Degradados CSS nativos (sin imágenes)
- Sin impacto en rendimiento
- Transiciones suaves (200-300ms)
- Optimizado para todos los navegadores modernos

---

## 7. PRÓXIMOS PASOS

1. ✅ Crear nueva configuración de colores
2. ✅ Implementar degradados en CSS
3. ✅ Actualizar componentes principales
4. ✅ Mejorar importación de PDF
5. ✅ Pruebas exhaustivas
6. ✅ Documentación final
