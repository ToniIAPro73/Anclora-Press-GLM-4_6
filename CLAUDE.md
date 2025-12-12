# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Anclora Press** is a full-stack book publishing web application built on modern technologies. The project combines a sophisticated Next.js frontend with rich editing capabilities, AI-powered assistance, and real-time collaboration features. It supports multi-format document import (8 formats via Pandoc) and professional export/publishing workflows.

## Technology Stack

- **Framework:** Next.js 15.3.5 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 with shadcn/ui components
- **Database:** Prisma ORM with SQLite
- **State Management:** Zustand
- **Data Fetching:** TanStack Query v5.82.0 + Axios
- **Forms:** React Hook Form + Zod validation
- **Rich Editing:** MDXEditor v3.39.1, React Markdown
- **Document Conversion:** Pandoc (supports TXT, MD, PDF, DOCX, RTF, ODT, EPUB)
- **Animations:** Framer Motion v12.23.2
- **UI Components:** 50+ shadcn/ui components built on Radix UI
- **Authentication:** Next Auth v4.24.11
- **Internationalization:** Next Intl v4.3.4
- **Image Processing:** Sharp v0.34.3
- **Drag & Drop:** DND Kit
- **Charts:** Recharts v2.15.4
- **Notifications:** Sonner v2.0.6
- **Icons:** Lucide React
- **Tables:** TanStack Table v8.21.3

## Project Structure

```text
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── import/              # Document import (Pandoc conversion)
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page (AncloraPress component)
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components (50+)
│   ├── anclora-press.tsx        # Main application
│   ├── text-editor.tsx          # Rich text editing
│   ├── enhanced-text-editor.tsx # Advanced editor
│   ├── chapter-editor.tsx       # Chapter management
│   ├── cover-editor.tsx         # Book cover design
│   ├── export-modal.tsx         # Export/download
│   ├── preview-modal.tsx        # Book preview
│   ├── ai-copilot.tsx           # AI assistance
│   └── collaboration-panel.tsx  # Real-time collaboration
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities & config
│   ├── db.ts                    # Prisma client singleton
│   └── utils.ts                 # cn() utility (clsx + tailwind-merge)
├── prisma/                       # Database schema
│   └── schema.prisma            # User and Post models
└── db/custom.db                 # SQLite database file
```

## Common Development Commands

```bash
# Development
npm run dev                  # Start dev server on localhost:3000 (logs to dev.log)
npm run lint                # Run ESLint

# Production
npm run build               # Build for production (standalone output mode)
npm start                   # Start production server (logs to server.log)

# Database
npm run db:push            # Sync Prisma schema to database
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run pending migrations
npm run db:reset           # Reset database and re-seed

# Running Tests
# Note: No test commands currently configured in package.json
```

## Architecture & Key Patterns

### Data Flow Architecture

**Backend:** Prisma ORM → SQLite Database
**Client State:** Zustand (global state) + React local state
**Server Data:** TanStack Query (caching, synchronization) + Axios (HTTP)
**UI:** React components with shadcn/ui composables

### Core Features

#### 1. Document Import System (`/api/import`)

- Converts 8 file formats: TXT, MD, PDF, DOCX, DOC, RTF, ODT, EPUB
- Uses Pandoc for format conversion (server external package)
- Validates: max 100 pages, 50MB file size limit
- Fallback content generation on conversion failure
- Spanish language fallback messages

#### 2. Book Editor Interface

- Step-by-step workflow for book creation
- Real-time text editing with MDXEditor
- Cover design capabilities
- Chapter organization (drag & drop via DND Kit)
- AI copilot assistance (component exists, integration TBD)
- Export/download in multiple formats
- Collaboration panel for real-time features

#### 3. Brand & Design System

- **Anclora Colors:** Deep Blue (#00253F), Teal Dark (#005872), Vivid Turquoise (#00B4A0), Mint (#80ED99), Sand (#D6BFA2)
- **Typography:** Libre Baskerville (serif), JetBrains Mono (code)
- **Border Radius:** lg: 28px, md: 24px, sm: 16px
- **Dark Mode:** Class-based (via Tailwind)
- **Responsive:** Mobile-first design

### React & Component Patterns

- **"use client" directive:** Most components are client-side (client-side rendering)
- **shadcn/ui:** Composable, Radix UI-based accessible components
- **React Hook Form + Zod:** Type-safe forms with validation
- **Custom hooks:** Centralized in `/src/hooks/` (e.g., use-mobile.ts, use-toast.ts)
- **Utility classes:** Use `cn()` from `@/lib/utils` for conditional Tailwind classes

### Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Configuration Details

### TypeScript (`tsconfig.json`)

- Target: ES2017
- Path alias: `@/*` → `./src/*`
- Strict mode enabled
- Incremental compilation enabled

### Next.js (`next.config.ts`)

- Output mode: "standalone" (optimized for production)
- Build errors ignored (typescript.ignoreBuildErrors: true)
- ESLint ignored during build (eslint.ignoreDuringBuilds: true)
- Pandoc as server external package
- React strict mode disabled (custom hot reload via nodemon)

### ESLint (`eslint.config.mjs`)

- Extends: next/core-web-vitals, next/typescript
- **Relaxed rules:** Very permissive config (no-explicit-any, no-unused-vars, exhaustive-deps all disabled)
- Note: This is intentionally loose to prioritize development speed

### Tailwind (`tailwind.config.ts`)

- Style preset: "new-york"
- Custom color palette with Anclora brand colors
- Custom border radius values
- Custom serif/mono font families

### Components (`components.json`)

- Component style: "new-york"
- RSC (React Server Components): Enabled
- Icon library: Lucide
- Path aliases configured for all component directories

## Important Implementation Notes

### Pandoc Integration

- Pandoc is a server-side dependency (specified in serverExternalPackages)
- Document import route expects FormData with file upload
- Handles format conversion and page counting
- Ensure pandoc-bin is properly installed in deployment

### Database Access

- Use Prisma client via `db.ts` singleton pattern (don't instantiate multiple clients)
- Database file: `/db/custom.db` (SQLite)
- Always generate client after schema changes: `npm run db:generate`

### Component Development

- Use shadcn/ui components from `/src/components/ui/` as building blocks
- Import with `@/components/ui/component-name`
- Use `cn()` utility for conditional styling
- Client components should have "use client" at the top

### Forms

- Combine React Hook Form + Zod for type-safe forms
- Define schemas in Zod first, then use with react-hook-form resolver
- Leverage shadcn/ui form components for consistent styling

### Styling

- Prefer Tailwind classes over inline styles
- Use custom Anclora brand colors (defined in tailwind.config.ts)
- Dark mode: add dark: prefix to classes (uses class strategy)

## Development Environment Setup

- **Node runtime:** Node.js (version check in package.json)
- **Package manager:** npm
- **Port:** 3000 (development), configurable for production
- **Logs:** dev.log (dev), server.log (production)
- **Auto-reload:** Via nodemon (configured in package.json scripts)
- **Reverse proxy:** Caddy available (Caddyfile configured for port 81)

## Deployment Considerations

- Next.js output is "standalone" - ready for containerized deployment
- SQLite database should be persisted in production
- Environment variables should be configured before build
- Pandoc must be available in deployment environment
- Caddy reverse proxy configuration available (Caddyfile)
- Docker support planned (`.dockerignore` exists)
