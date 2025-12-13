# CONTEXTO DEL PROYECTO

Anclora Press es una plataforma web para la edicion y publicacion digital de libros. El stack principal combina **Next.js 15 (App Router)**, **TypeScript**, **Tailwind 4/shadcn**, y **Prisma** sobre SQLite. El frontend trabaja con componentes server-first y cuenta con persistencia local (IndexedDB + Zustand) para soportar trabajo offline, ademas de pipelines de importacion, previsualizacion y exportacion (Pandoc + Paged.js).

## Estado actual
- El limite de importacion esta fijado en **300 paginas / 50 MB** y ahora se calcula con los metadatos nativos del DOCX (`docProps/app.xml`) gracias a `jszip`. Ejecuta `npm install` para asegurar la dependencia antes de compilar.
- El area de importacion en `TextEditor` ya acepta arrastrar y soltar; la zona punteada debe seguir escuchando los eventos `dragenter/over/leave/drop` para no romper la UX.
- `src/lib/document-importer.ts` centraliza la conversion DOCX (Mammoth + limpieza HTML) y expone `wordCount`, `estimatedPages` y advertencias. `/api/import` confia en esos valores para validar y responder al cliente.
- El resto del flujo (edicion, capitulos, plantillas y exportacion) sigue lo descrito en `README.md`, `SESSION_PROGRESS.md` y `ROADMAP_MVP.md`. Directorios clave: `src/app` (rutas y server actions), `src/components` (UI reutilizable), `src/lib` (utilidades), `prisma/` (esquema) y `docs/` (referencias y reportes de fase).

## Proximos pasos sugeridos
1. Ejecutar `npm install` o `npm ci` para asegurar `jszip` y luego correr `npm run dev`/`npm run build`.
2. Validar importaciones grandes (p.ej. *El pacto de jade.docx*, 237 paginas) para confirmar que el backend respeta el nuevo calculo.
3. Mantener `START_HERE*.md` y `SESSION_*` al dia cuando se entreguen nuevas fases o fixes criticos.
