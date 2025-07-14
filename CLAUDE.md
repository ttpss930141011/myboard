# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BoardWex is a real-time collaborative whiteboard application (Miro clone) built with:
- **Frontend**: Next.js 14, React 18, TypeScript (strict mode)
- **Real-time**: Liveblocks (collaboration), Convex (database)
- **Auth**: Clerk (with organizations and invites)
- **State**: Zustand (UI), Liveblocks (collaborative), Convex (persistent)
- **Styling**: Tailwind CSS, Shadcn/UI (Radix UI primitives)

## Development Commands

```bash
# Install dependencies
npm install

# Start Convex backend (required - run in separate terminal)
npx convex dev

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Type checking (no built-in command, use)
npx tsc --noEmit
```

## Architecture

### State Management Layers
1. **Liveblocks**: Real-time collaboration (cursors, canvas state, presence)
2. **Convex**: Persistent data (boards, favorites, search)
3. **Zustand**: Local UI state (modals, preferences)

### Key Design Patterns
- **Room-based isolation**: Each board is a Liveblocks room
- **Optimistic updates**: UI updates before server confirmation
- **Throttled sync**: 16ms throttle for smooth real-time updates

### Canvas Architecture
The canvas (`app/board/[boardId]/_components/canvas.tsx`) handles:
- Layer management (max 100 layers)
- Drawing operations (shapes, freehand, text)
- Selection and multi-selection
- Real-time cursor tracking
- Undo/redo via Liveblocks history

Canvas modes:
- `None`: Default state
- `Inserting`: Adding shapes/text
- `Pencil`: Freehand drawing
- `SelectionNet`: Multi-select drag
- `Translating`: Moving layers
- `Resizing`: Resizing layers

### Database Schema (Convex)
```typescript
boards: {
  title: string
  orgId: string  // Clerk organization ID
  authorId: string
  authorName: string
  imageUrl: string
}

userFavorites: {
  orgId: string
  userId: string
  boardId: id('boards')
}
```

## Critical Security Considerations

⚠️ **IMPORTANT**: The following security issues exist in the current codebase:

1. **Authorization Gap**: Convex mutations (`remove`, `update`, `favorite`) only check authentication, not organization membership. Always verify `board.orgId === identity.orgId` before operations.

2. **IDOR Vulnerability**: The `get` query in `/convex/board.ts` returns board data without authorization checks.

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
- ⚠️ Avoid `any` types (currently used in `use-api-mutation.ts`)

## Environment Variables Required

```bash
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
LIVEBLOCKS_SECRET_KEY=
```

## Common Development Patterns

### Adding a New Layer Type
1. Add to `LayerType` enum in `types/canvas.ts`
2. Create layer interface extending base properties
3. Update `Layer` union type
4. Add rendering logic in `layer-preview.tsx`
5. Add insertion logic in toolbar

### Working with Real-time Features
- Use `useMutation` from Liveblocks for canvas operations
- Use Convex mutations for persistent data
- Presence updates are automatic via Liveblocks

### Authentication Flow
- Clerk middleware protects all routes by default
- Liveblocks auth happens in `/app/api/liveblocks-auth/route.ts`
- Organization context provided by Clerk

## Known Issues to Address

1. Single-letter variable names in `/lib/utils.ts`
2. Missing error boundaries
3. No test infrastructure
4. Magic numbers without constants (e.g., MAX_LAYERS = 100)
5. Commented-out code in canvas.tsx (lines 408-410)