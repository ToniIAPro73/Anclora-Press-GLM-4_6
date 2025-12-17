# Instrucciones de Aplicación de Cambios - Vista Previa

## Archivos a Reemplazar

| Archivo Original        | Archivo Corregido             | Ubicación         |
| ----------------------- | ----------------------------- | ----------------- |
| `content-paginator.ts`  | `content-paginator-fixed.ts`  | `src/lib/`        |
| `preview-builder.ts`    | `preview-builder-fixed.ts`    | `src/lib/`        |
| `table-of-contents.tsx` | `table-of-contents-fixed.tsx` | `src/components/` |
| `page-renderer.tsx`     | `page-renderer-fixed.tsx`     | `src/components/` |

## Cambio Adicional en preview-modal-v2.tsx

Ubicación: `src/components/preview-modal-v2.tsx`

### Cambio Requerido

Buscar (línea ~572-577):

```tsx
<TableOfContents
  chapters={bookData.chapters || []}
  pages={pages}
  currentPage={currentPage}
  onNavigate={goToPage}
/>
```

Reemplazar por:

```tsx
<TableOfContents
  bookData={bookData}
  pages={pages}
  currentPage={currentPage}
  onNavigate={goToPage}
/>
```

## Resumen de Cambios Realizados

### 1. content-paginator-fixed.ts

- Factor de corrección 0.75 en líneas por página
- Ancho de carácter más preciso (0.5 vs 0.6)
- Spacing entre párrafos (+1.5 líneas)
- Page break forzado antes de H1/H2
- Fallback para SSR (server-side rendering)

### 2. preview-builder-fixed.ts

- **ELIMINADA** página de título (era redundante)
- **AÑADIDA** página de Índice (TOC) después de portada
- Estructura: Portada → Índice → Preámbulo (opcional) → Capítulos
- Numeración de páginas corregida
- Nueva función `buildTOCForSidebar()`

### 3. table-of-contents-fixed.tsx

- Recibe `bookData` en lugar de `chapters`
- Muestra: Portada, Índice, Preámbulo (si existe), Capítulos
- Iconos visuales para cada tipo de sección
- Contador de capítulos corregido
- Numeración de páginas correcta (1-indexed para display)

### 4. page-renderer-fixed.tsx

- Soporte para tipo de página `'toc'`
- Eliminado soporte para `'title'` (reemplazado por TOC)
- Número de página solo visible a partir de pág. 2
- Header de capítulo en páginas de contenido

## Estructura de Páginas Resultante

```text
Pág. 1: Portada (sin número de página visible)
Pág. 2: Índice (con tabla de contenidos)
Pág. 3: Preámbulo (si existe contenido del manuscrito)
Pág. 4+: Capítulos numerados
```

## Verificación Post-Cambios

1. Crear un libro nuevo sin editar portada → debe mostrar N páginas
2. Editar portada y guardar → debe mantener el mismo número de páginas
3. El índice debe mostrar:
   - Portada (Pág. 1)
   - Índice (Pág. 2)
   - Preámbulo (si existe)
   - Capítulos con números correctos
4. El contador de capítulos debe excluir Portada, Índice y Preámbulo
