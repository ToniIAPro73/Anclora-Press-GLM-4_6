# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds App Router routes with colocated layouts/loading/error states; keep each feature self-contained.
- Shared UI and logic live in `src/components`, `src/contexts`, `src/hooks`, and `src/lib`, with filenames mirroring exports (PascalCase component, camelCase helper).
- Assets belong in `public/`, specs in `docs/`, Prisma schema/migrations in `prisma/`, and helper utilities in `scripts/`, while `mini-services/` is reserved for experiments.

## Build, Test & Development Commands
- `npm install` – install dependencies (needed now that `jszip` powers DOCX metadata parsing).
- `npm run dev` – start the local server on port 3000 (use `npm run dev:clean` if Windows leaves ports busy).
- `npm run build` – production compile; fails on type or lint errors.
- `npm run start` – serve the `.next/standalone` output for staging checks.
- `npm run lint` – Next.js ESLint rules; run before commits.
- `npm run db:push`, `npm run db:migrate`, `npm run db:reset` – update the Prisma-managed SQLite database referenced in `DATABASE_URL`.

## Coding Style & Naming Conventions
- Favor TypeScript React Server Components; only opt into `"use client"` when interactivity is required.
- Follow ESLint (`eslint.config.mjs`); rely on the formatter for spacing and stick to two-space indentation.
- Name components/files in PascalCase (`BookManager.tsx`), hooks as `useX`, and helpers in camelCase (`lib/formatDate.ts`).
- Centralize Tailwind variants via `class-variance-authority` helpers and pull user-facing strings from shared translation utilities to stay i18n-ready.

## Testing Guidelines
Automated tests are light, so `npm run lint` plus manual QA is mandatory. When adding coverage, colocate `Component.test.tsx` files with the source and reuse the Testing Library pattern built into Next.js. Smoke-test document import/export (Pandoc, mammoth), editor interactions, and authentication whenever you touch those areas.

## Commit & Pull Request Guidelines
Commits follow short, imperative titles in Spanish or English (`mejora importación archivos .docx`, `Fix: Increase server action body size limit`) and stay scoped to one concern. PRs must include a summary, testing evidence (`npm run lint`, manual flows), screenshots or GIFs for UI work, and confirmation that roadmap/checklist docs (START_HERE*, MVP_*) are updated or unaffected. Do not merge until reviewers validate Prisma changes and environment updates.

## Security & Configuration Tips
Store secrets in `.env.local`; set `DATABASE_URL`, `NEXTAUTH_SECRET`, and Pandoc paths before using Prisma or document exports. Keep uploads inside ignored folders under `public/` and rotate `/logs` before sharing because they may include reader data. Honor the file-size limits enforced by `next.config.ts` and `middleware.ts`, and never commit `.next/` outputs or SQLite artifacts.

## Document Import Notes
- The `/api/import` route now reads DOCX metadata via `jszip` (run `npm install`) so page counts rely on `docProps/app.xml` instead of rough estimates.
- Imports hard-stop at 300 pages or 50MB; if a document is rejected incorrectly, inspect the metadata extraction before loosening the cap.
- Drag-and-drop on the editor import card was recently fixed—keep pointer events bound to the dashed zone so file drops continue to work.
