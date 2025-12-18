# Fix: Editor Avanzado de Portada

## Problema

Cuando se abre el Editor Avanzado desde el editor de portada, no muestra la portada completa como base, sino solo la imagen de fondo. Falta el título, autor, subtítulo y demás elementos.

## Solución

Capturar la portada como imagen usando `html2canvas` antes de abrir el editor avanzado.

---

## Paso 1: Instalar dependencia

```bash
npm install html2canvas
npm install --save-dev @types/html2canvas
```

---

## Paso 2: Reemplazar archivos

### Archivo 1: `src/components/cover-editor.tsx`

Reemplazar con `cover-editor-fixed.tsx`

**Cambios principales:**

- Añadido `useRef` para referenciar el contenedor de la portada
- Nueva función `captureCoverAsImage()` que usa html2canvas
- Nueva función `handleOpenAdvancedEditor()` que captura antes de abrir
- Pasado `onBeforeOpen` al AdvancedCoverEditor
- Añadidas nuevas props: `subtitle`, `coverLayout`, `coverFont`

### Archivo 2: `src/components/advanced-cover-editor/AdvancedCoverEditor.tsx`

Reemplazar con `AdvancedCoverEditor-fixed.tsx`

**Cambios principales:**

- Nueva prop `onBeforeOpen?: () => Promise<string | null>`
- Nuevas props: `subtitle`, `coverLayout`, `coverFont`
- Estado `capturedImage` para almacenar la imagen capturada
- Función `handleOpen()` que llama a `onBeforeOpen` antes de abrir
- Si hay imagen capturada, NO añade texto (ya viene en la imagen)

---

## Paso 3: Aplicar el mismo fix a `back-cover-editor.tsx`

El archivo `src/components/back-cover-editor.tsx` tiene el mismo problema.

### Cambios necesarios

**1. Añadir imports:**

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
```

**2. Añadir refs y estado después de los otros useState (línea ~26306):**

```tsx
// REF PARA CAPTURA DE CONTRAPORTADA
const backCoverPreviewRef = useRef<HTMLDivElement>(null);
const [capturedBackCoverImage, setCapturedBackCoverImage] = useState<
  string | null
>(null);
const [isCapturing, setIsCapturing] = useState(false);
```

**3. Añadir función de captura (antes del return):**

```tsx
// FUNCIÓN PARA CAPTURAR LA CONTRAPORTADA COMO IMAGEN
const captureBackCoverAsImage = useCallback(async (): Promise<
  string | null
> => {
  if (!backCoverPreviewRef.current) return null;

  setIsCapturing(true);

  try {
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(backCoverPreviewRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    const imageData = canvas.toDataURL("image/png", 1.0);
    setCapturedBackCoverImage(imageData);
    return imageData;
  } catch (error) {
    console.error("Error capturing back cover:", error);
    return coverImage;
  } finally {
    setIsCapturing(false);
  }
}, [coverImage]);

const handleOpenAdvancedEditor = useCallback(async () => {
  const captured = await captureBackCoverAsImage();
  return captured;
}, [captureBackCoverAsImage]);
```

**4. Añadir ref al contenedor de vista previa (~línea 26417):**

```tsx
// ANTES:
<div className="aspect-3/4 max-w-sm mx-auto relative overflow-hidden rounded-lg shadow-lg">

// DESPUÉS:
<div
  ref={backCoverPreviewRef}
  className="aspect-3/4 max-w-sm mx-auto relative overflow-hidden rounded-lg shadow-lg"
>
```

**5. Modificar llamada a AdvancedCoverEditor (~línea 26399):**

```tsx
// ANTES:
<AdvancedCoverEditor
  initialImage={coverImage || undefined}
  title={title}
  author={author}
  coverColor={coverColor}
  onSave={(imageData) => {
    onImageChange(imageData);
  }}
/>

// DESPUÉS:
<AdvancedCoverEditor
  initialImage={capturedBackCoverImage || coverImage || undefined}
  title={backCoverData.title || title}
  author={backCoverData.author || author}
  coverColor={coverColor}
  onBeforeOpen={handleOpenAdvancedEditor}
  onSave={(imageData) => {
    onImageChange(imageData);
  }}
/>
```

---

## Flujo de funcionamiento

```text
Usuario hace clic en "Edición Avanzada"
       ↓
handleOpen() se ejecuta
       ↓
onBeforeOpen() captura la portada con html2canvas
       ↓
Se guarda la imagen capturada en capturedImage
       ↓
Se abre el modal
       ↓
handleCanvasReady() carga capturedImage como fondo
       ↓
El usuario ve la portada completa y puede editarla
```

---

## Notas técnicas

### html2canvas configuración

```typescript
const canvas = await html2canvas(coverPreviewRef.current, {
  scale: 2, // Alta resolución
  useCORS: true, // Permitir imágenes externas
  allowTaint: true, // Permitir imágenes tainted
  backgroundColor: null, // Transparente
  logging: false, // Sin logs
});
```

### Importación dinámica

Se usa importación dinámica para evitar problemas de SSR:

```typescript
const html2canvas = (await import("html2canvas")).default;
```

---

## Verificación

1. Abrir el editor de portada
2. Configurar título, autor, imagen de fondo
3. Hacer clic en "Edición Avanzada"
4. **Esperado:** La portada completa aparece como base en el canvas
5. **Antes del fix:** Solo aparecía la imagen de fondo
