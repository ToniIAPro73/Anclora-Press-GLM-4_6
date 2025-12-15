# Resumen de la Implementación: Importación Avanzada de Documentos y OCR

Se ha realizado una refactorización completa del motor de importación de documentos de Anclora Press para maximizar la fidelidad de la estructura y el contenido, priorizando soluciones Open Source y de bajo coste, tal como se solicitó.

## 1. Arquitectura Híbrida de Importación

La API de importación (`src/app/api/import/route.ts`) ahora implementa una lógica de decisión escalonada para cada tipo de archivo, asegurando que se utilice el mejor método disponible para preservar la estructura y el diseño original.

| Formato | Estrategia de Importación | Herramientas Utilizadas | Fidelidad |
| :--- | :--- | :--- | :--- |
| **DOCX** | **Mejorada con Fallback** | `parseDOCXEnhanced` (Mammoth.js con mapeo de estilos avanzado) y `Pandoc` (como fallback). | Alta |
| **EPUB** | **Nativa y Estructurada** | `parseEPUB` (Parser dedicado para EPUB) | Alta |
| **PDF** | **Híbrida (Texto Nativo + OCR)** | 1. `extractPdfContentEnhanced` (para texto digital). 2. **OCR** (`extractWithOCR`) como fallback para PDFs escaneados. | Alta (para texto digital), Media-Alta (para escaneados) |
| **DOC, RTF, ODT** | **Conversión Estándar** | `Pandoc` (para conversión a Markdown/HTML) | Media |

## 2. Integración de OCR para PDFs Escaneados

Se ha implementado una solución de Reconocimiento Óptico de Caracteres (OCR) para abordar el problema de los PDFs basados en imágenes:

*   **Módulo:** `src/lib/ocr-handler.ts`
*   **Librerías:** Se integró `Tesseract.js` (y se preparó para `scribe.js-ocr`) para el reconocimiento de texto en imágenes y PDFs sin capa de texto.
*   **Flujo de PDF:** Si la extracción de texto nativo falla, la API intenta automáticamente el OCR.

## 3. Módulos de Preservación Semántica

Se crearon módulos dedicados para mejorar la calidad de la importación:

*   **`src/lib/docx-enhanced.ts`**: Extiende Mammoth.js para un mejor mapeo de estilos (títulos, listas, tablas) a Markdown.
*   **`src/lib/epub-parser.ts`**: Utiliza un parser de EPUB para extraer metadatos y contenido por capítulos, preservando la estructura del libro.

## 4. Archivos Modificados y Nuevos

| Archivo | Descripción |
| :--- | :--- |
| `src/app/api/import/route.ts` | Refactorización completa de la lógica de decisión de importación. |
| `src/lib/ocr-handler.ts` | **NUEVO:** Lógica de orquestación de OCR. |
| `src/lib/epub-parser.ts` | **NUEVO:** Lógica de parsing de EPUB. |
| `src/lib/docx-enhanced.ts` | **NUEVO:** Lógica de mejora de Mammoth.js. |
| `package.json` | Nuevas dependencias instaladas (`tesseract.js`, `@lingo-reader/epub-parser`, etc.). |

## 5. Pasos para el Usuario

Todos los cambios están en la rama `refactor-paleta-importacion`. Para probar la nueva funcionalidad:

1.  **Asegúrese de estar en la rama `refactor-paleta-importacion`:**
    ```bash
    git checkout refactor-paleta-importacion
    ```
2.  **Instale las nuevas dependencias:**
    ```bash
    npm install
    ```
3.  **Ejecute la aplicación:**
    ```bash
    npm run dev
    ```

Ahora puede probar la importación de PDFs escaneados, DOCX complejos y archivos EPUB. La tarea está finalizada.
