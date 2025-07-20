# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BoardWex is a real-time collaborative whiteboard application (Miro clone) built with:
- **Frontend**: Next.js 14, React 18, TypeScript (strict mode)
- **Database**: Prisma with PostgreSQL
- **Auth**: Clerk (with organizations and invites)
- **State**: Zustand (canvas state and UI state)
- **Styling**: Tailwind CSS, Shadcn/UI (Radix UI primitives)
- **Package Manager**: pnpm

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Type checking
pnpm exec tsc --noEmit
```

## Architecture

### State Management Layers
1. **Prisma**: Persistent data (boards, favorites, canvas data)
2. **Zustand**: Canvas state, UI state (modals, preferences), history (undo/redo)
3. **React Query**: Server state management and caching

### Key Design Patterns
- **Board isolation**: Each board has its own canvas state
- **Optimistic updates**: UI updates before server confirmation
- **History management**: Undo/redo via Zustand with max 50 entries

### Canvas Architecture
The canvas (`app/board/[boardId]/_components/canvas.tsx`) handles:
- Layer management (max 100 layers)
- Drawing operations (shapes, freehand, text)
- Selection and multi-selection
- Cursor tracking
- Undo/redo via Zustand history

Canvas modes:
- `None`: Default state
- `Inserting`: Adding shapes/text
- `Pencil`: Freehand drawing
- `SelectionNet`: Multi-select drag
- `Translating`: Moving layers
- `Resizing`: Resizing layers

### Database Schema (Prisma)
```typescript
Board {
  id: string
  title: string
  imageUrl: string
  orgId: string  // Clerk organization ID
  authorId: string
  authorName: string
  canvasData: Json  // Canvas state
  createdAt: DateTime
  updatedAt: DateTime
}

UserFavorite {
  id: string
  userId: string
  boardId: string
  orgId: string
  createdAt: DateTime
}
```

## Critical Security Considerations

⚠️ **IMPORTANT**: The following security issues exist in the current codebase:

1. **Authorization Gap**: API routes (`DELETE`, `PATCH`, `POST /favorite`) only check authentication, not organization membership. Always verify `board.orgId === user.orgId` before operations.

2. **IDOR Vulnerability**: API routes return board data without proper authorization checks.

3. **Input Validation**: Board titles need sanitization to prevent XSS.

## Performance Considerations

1. **Canvas Rendering**: The canvas component (487 lines) needs decomposition and memoization
2. **N+1 Query**: Board favorite status creates separate queries per board
3. **Re-renders**: Missing React.memo on LayerPreview components
4. **Bundle Size**: No code splitting implemented

## Type System

- TypeScript strict mode enabled
- Path aliasing: `@/*` maps to root directory
- Canvas types in `types/canvas.ts` define all layer types and states
- ⚠️ Avoid `any` types

## Environment Variables Required

```bash
DATABASE_URL=  # PostgreSQL connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
```

## Common Development Patterns

### Adding a New Layer Type
1. Add to `LayerType` enum in `types/canvas.ts`
2. Create layer interface extending base properties
3. Update `Layer` union type
4. Add rendering logic in `layer-preview.tsx`
5. Add insertion logic in toolbar

### Working with Canvas State
- Use Zustand store for canvas operations
- Use API routes for persistent data
- Canvas state is saved to database via API

### Authentication Flow
- Clerk middleware protects all routes by default
- Organization context provided by Clerk
- API routes verify auth via Clerk session

## Known Issues to Address

1. ~~Single-letter variable names in `/lib/utils.ts`~~ (Fixed)
2. Missing error boundaries
3. No test infrastructure
4. ~~Magic numbers without constants~~ (Fixed)
5. ~~Commented-out code in canvas.tsx~~ (Not found)