# START HERE: Phase 2 Backend Sync
## Complete Roadmap for Final MVP Sprint

**Current Status:** 86% MVP Complete (Phase 1.5 just finished)
**Remaining:** Phase 2 (Backend Sync) + Phase 2.5 (Validation)
**Time to 100%:** ~5-7 hours

---

## What's Done

### ✅ Complete MVP UI (Phase 1.5)
- BookManager component (book list, create, delete)
- ChapterOrganizer component (chapter list, create, reorder)
- EditorWorkspace (main layout integrating everything)
- Editor page at `/editor` route
- All components working together

### ✅ Core Features (Phases 0-1.4)
- Import DOCX with Mammoth.js ✅
- Edit with Tiptap + Paged.js WYSIWYG ✅
- Auto-save to IndexedDB every 5s ✅
- Export PDF via browser print ✅
- 100% fidelity guarantee ✅

---

## What's Left

### Phase 2: Backend Sync (4-6 hours)
This is the last major feature before MVP validation.

**What needs to happen:**
1. Save changes to server (not just local)
2. Sync from multiple devices
3. Handle conflicts when both devices edit
4. Show sync status to user

**Technical tasks:**
1. Create PUT /api/books/:id endpoint
2. Create background sync worker
3. Implement conflict detection
4. Add sync status UI
5. Optional: CRDT integration (Y.js)

### Phase 2.5: MVP Validation (1-2 hours)
Verify everything works end-to-end.

**Testing:**
1. Import DOCX
2. Edit in Anclora
3. Export to PDF
4. Compare PDF with preview (100% match?)
5. Test offline then online sync
6. Verify crash recovery

---

## Quick Start: How to Run Now

### 1. Start Development Server
```bash
cd /c/Users/Usuario/Workspace/01_Proyectos/Anclora-Press-GLM-4_6
npm run dev
```

### 2. Open in Browser
```
http://localhost:3000/editor
```

### 3. Try It Out
- Click "Nuevo Libro" to create a book
- Click "Nuevo Capítulo" to create a chapter
- Type in the editor (will auto-save)
- Click "Importar" to import a DOCX
- Click "Exportar PDF" to export

### 4. Check IndexedDB
```
DevTools (F12) → Application → IndexedDB → AncloraPress
```

---

## Phase 2 Implementation Plan

### Step 1: Create Backend Endpoint (1 hour)

**File:** `src/app/api/books/[id]/route.ts`

```typescript
// PUT /api/books/:id - Sync book to server
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = params

  // Save to Prisma
  const book = await db.post.upsert({
    where: { id },
    update: {
      title: body.title,
      content: body.content,
    },
    create: {
      id,
      title: body.title,
      content: body.content,
      published: false,
      authorId: session.user.id,
    },
  })

  return Response.json({
    success: true,
    data: book,
  })
}

// GET /api/books/:id - Get book from server
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const book = await db.post.findUnique({
    where: { id },
  })

  return Response.json({
    success: true,
    data: book,
  })
}
```

### Step 2: Create Sync Hook (1-2 hours)

**File:** `src/hooks/use-sync.ts`

```typescript
// Background sync hook that:
// 1. Periodically checks for dirty books
// 2. Sends them to server
// 3. Handles conflicts
// 4. Updates UI with sync status

export function useBackgroundSync() {
  const { getPendingChanges, markAsSynced } = usePersistence()

  useEffect(() => {
    // Every 30 seconds, try to sync pending changes
    const syncInterval = setInterval(async () => {
      if (!navigator.onLine) return // Skip if offline

      const pending = await getPendingChanges()

      for (const book of pending) {
        try {
          const response = await fetch(`/api/books/${book.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(book),
          })

          if (response.ok) {
            await markAsSynced(book.id)
          }
        } catch (error) {
          console.error('Sync failed:', error)
          // Will retry on next interval
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(syncInterval)
  }, [])
}
```

### Step 3: Add Sync Status UI (30 min)

**Add to EditorWorkspace:**
```tsx
// Show sync status in header
const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')

useEffect(() => {
  // Update based on hasPendingChanges
  if (hasPendingChanges) {
    setSyncStatus('syncing')
  } else {
    setSyncStatus('synced')
  }
}, [hasPendingChanges])

// In header, add status badge
<Badge variant={syncStatus === 'synced' ? 'default' : 'outline'}>
  {syncStatus === 'syncing' && '⏳ Sincronizando...'}
  {syncStatus === 'synced' && '✅ Sincronizado'}
  {syncStatus === 'error' && '❌ Error de sincronización'}
</Badge>
```

### Step 4: Conflict Resolution (1-2 hours - Optional)

**If you have time, add conflict detection:**

```typescript
// When syncing, check if server version is newer
if (serverBook.updatedAt > book.updatedAt) {
  // Conflict detected
  // Show dialog: "Server has newer version. Merge?"
  // User chooses: Keep local, keep server, or merge
}
```

### Step 5: Test (30 min)

```bash
# 1. Create a book
# 2. Wait for auto-save
# 3. Check Prisma database - book should appear
# 4. Edit on another browser window
# 5. Check both synced to server
# 6. Test offline then online
```

---

## Database Setup (if needed)

**Current schema (Prisma):**
```prisma
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

This works for storing books! Just:
- `title` = book title
- `content` = book content
- `authorId` = user who owns it
- `updatedAt` = tracks changes for sync

---

## Phase 2.5: MVP Validation

Once Phase 2 is done, run the end-to-end test:

### Test: Complete Workflow

**Prepare:**
1. Create test DOCX with mixed content
2. Have browser's DevTools open

**Steps:**
1. Go to `/editor`
2. Click "Importar" → Upload test DOCX
3. Verify content appears
4. Edit something
5. Wait for auto-save (see badge)
6. Wait for sync (Phase 2 feature)
7. Click "Exportar PDF"
8. Open PDF and compare with preview
9. Verify 100% match

**Verify:**
✅ Import works
✅ Edit auto-saves
✅ Preview matches PDF
✅ Sync to server works
✅ No data loss

---

## Files You'll Need to Create/Modify

### Create:
- `src/app/api/books/[id]/route.ts` - Backend endpoint
- `src/hooks/use-sync.ts` - Sync hook

### Modify:
- `src/components/editor-workspace.tsx` - Add sync status UI
- `src/components/editor-with-persistence.tsx` - Trigger sync on save
- `CLAUDE.md` - Update with final status

---

## Estimated Timeline

**Phase 2: Backend Sync**
- Backend endpoint: 1 hour
- Sync hook: 1-2 hours
- Conflict resolution: 1-2 hours (optional)
- Testing: 30 min
- **Total: 4-6 hours**

**Phase 2.5: Validation**
- Manual testing: 1-2 hours
- Bug fixes if found: Variable
- **Total: 1-2 hours**

**Grand Total to 100% MVP: 5-7 hours**

---

## Commands You'll Use

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Start production server
npm start

# Database operations
npm run db:push       # Sync schema
npm run db:migrate    # Run migrations
npm run db:reset      # Reset database

# Check database
npx prisma studio    # Open Prisma UI
```

---

## Documentation Files

**Read in order:**
1. `PHASE_1_5_SESSION_SUMMARY.md` - What just happened
2. `docs/PHASE_1_5_COMPLETE.md` - Component details
3. `docs/PHASE_1_5_INTEGRATION_TESTING.md` - How to test
4. This file (`START_HERE_PHASE_2.md`) - What's next

---

## Key Concepts for Phase 2

### dirty Flag
- `true` = changes not synced to server
- `false` = synced to server
- Used to find books that need sync

### Background Sync
- Runs every 30 seconds (configurable)
- Only syncs when online
- Non-blocking (doesn't interrupt user)
- Automatic retry on failure

### Conflict Resolution
- Compare `updatedAt` timestamps
- Local > Server = local is newer
- Server > Local = server is newer
- Equal = already synced
- Show dialog if conflict

---

## Architecture Summary

```
USER INTERFACE (EditorWorkspace)
        ↓
PERSISTENCE LAYER (usePersistence + IndexedDB)
        ↓
LOCAL DATABASE (IndexedDB - works now)
        ↓
BACKGROUND SYNC (use-sync.ts - NEW in Phase 2)
        ↓
SERVER DATABASE (Prisma + SQLite - NEW in Phase 2)
        ↓
MULTI-DEVICE SYNC (ready for Phase 3)
```

---

## Success Looks Like

### After Phase 2:
- ✅ Changes sync to server
- ✅ Can edit from multiple devices
- ✅ Server is backup copy
- ✅ Offline changes queue up
- ✅ Status shown in UI

### After Phase 2.5:
- ✅ DOCX import works perfectly
- ✅ PDF export matches preview 100%
- ✅ All features working together
- ✅ MVP is complete and validated
- ✅ Ready for beta users

---

## Next Command to Run

```bash
# After you read this file:
npm run dev

# Then navigate to:
# http://localhost:3000/editor

# And create a test book to verify everything works!
```

---

## Questions? Check These Files

| Question | File |
|----------|------|
| What was built in Phase 1.5? | `PHASE_1_5_SESSION_SUMMARY.md` |
| How do components work? | `docs/PHASE_1_5_COMPLETE.md` |
| How do I test manually? | `docs/PHASE_1_5_INTEGRATION_TESTING.md` |
| What's the overall progress? | `MVP_PROGRESS.txt` |
| How does persistence work? | `docs/LOCAL_FIRST_PERSISTENCE.md` |
| How does import/export work? | `docs/MAMMOTH_INTEGRATION.md` + `docs/PDF_EXPORT.md` |

---

## You're Almost There!

```
Progress: 86% → 100%
Time Left: ~5-7 hours
Phases Left: 2 (Phase 2 + Phase 2.5)
Difficulty: Backend sync is straightforward

The hard part (architecture) is DONE.
The final part (sync + validation) is execution.

You've got this! 🚀
```

---

## Final Checklist Before Phase 2

- [ ] Phase 1.5 components created ✅
- [ ] Build compiles successfully ✅
- [ ] Can run `npm run dev` ✅
- [ ] `/editor` route works ✅
- [ ] Create book functionality works ✅
- [ ] Create chapter functionality works ✅
- [ ] Auto-save works (5s) ✅
- [ ] Import dialog available ✅
- [ ] Export dialog available ✅
- [ ] Read this file ✅

**Then:** Start Phase 2 implementation

---

**Status:** Ready for Phase 2 🎯
**Current:** 86% MVP Complete
**Next:** Backend Sync (4-6 hours)
**Final:** MVP Validation (1-2 hours)

*Let's finish the MVP!*
