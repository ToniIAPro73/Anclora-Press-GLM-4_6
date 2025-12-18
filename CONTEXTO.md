# CONTEXTO DEL PROYECTO

Anclora Press es una plataforma web para la edicion y publicacion digital de libros. El stack principal combina **Next.js 15 (App Router)**, **TypeScript**, **Tailwind 4/shadcn**, y **Prisma** sobre SQLite. El frontend trabaja con componentes server-first y cuenta con persistencia local (IndexedDB + Zustand) para soportar trabajo offline, ademas de pipelines de importacion, previsualizacion y exportacion (Pandoc + Paged.js).

## Estado actual
- El limite de importacion esta fijado en **300 paginas / 50 MB** y ahora se calcula con los metadatos nativos del DOCX (`docProps/app.xml`) gracias a `jszip`. Ejecuta `npm install` para asegurar la dependencia antes de compilar.
- El area de importacion en `TextEditor` ya acepta arrastrar y soltar; la zona punteada debe seguir escuchando los eventos `dragenter/over/leave/drop` para no romper la UX.
- `src/lib/document-importer.ts` centraliza la conversion DOCX (Mammoth + limpieza HTML) y expone `wordCount`, `estimatedPages` y advertencias. `/api/import` confia en esos valores para validar y responder al cliente.
- El resto del flujo (edicion, capitulos, plantillas y exportacion) sigue lo descrito en `README.md`, `SESSION_PROGRESS.md` y `ROADMAP_MVP.md`. Directorios clave: `src/app` (rutas y server actions), `src/components` (UI reutilizable), `src/lib` (utilidades), `prisma/` (esquema) y `docs/` (referencias y reportes de fase).
- El visor de progreso ahora usa un mini-mapa (sin scroll horizontal) y los botones de vista previa/exportacion solo se habilitan cuando los pasos previos estan completos, evitando errores al abrir modales sin datos.
- La vista previa (`preview-modal-v2.tsx`) incluye un indice de navegacion completo con todas las secciones del libro: Portada → Índice → Preámbulo → Capítulos → Contraportada. El indice lateral permite saltar directamente a cualquier seccion, incluyendo la contraportada cuando esta configurada.
- La interfaz arranca siempre en modo oscuro (`<html class="dark">`); el control de tema solo alterna entre oscuro y claro bajo demanda del usuario.
- Se incorporo un paquete de pruebas rapidas (`npm run test`) que valida la deteccion de capitulos estructurados y la generacion del markdown para la vista previa (`scripts/run-tests.ts`). Mantenerlo en verde antes de desplegar.

## Proximos pasos sugeridos
1. Ejecutar `npm install` o `npm ci` para asegurar `jszip` y luego correr `npm run dev`/`npm run build`.
2. Validar importaciones grandes (p.ej. *El pacto de jade.docx*, 237 paginas) para confirmar que el backend respeta el nuevo calculo.
3. Ejecutar `npm run test` tras tocar importadores o preview builder para garantizar que los capitulos y la portada sigan renderizando correctamente.
4. Mantener `START_HERE*.md` y `SESSION_*` al dia cuando se entreguen nuevas fases o fixes criticos.
