# Architecture Changes: From Collaborative to Personal Whiteboard

## Overview

This document outlines the major architectural transformation from the original BoardWex (a real-time collaborative whiteboard) to MyBoard - a single-user personal whiteboard application. This refactoring removed expensive SaaS dependencies while maintaining all core functionality.

## Key Changes

### 1. Authentication Migration: Clerk to Auth.js

**Before:**
- **Clerk**: Proprietary authentication service ($74/month)
- Organization-based multi-tenancy
- Built-in UI components and organization switcher
- Managed user sessions and JWT tokens

**After:**
- **Auth.js v5 (NextAuth)**: Open-source authentication (free)
- Single-user workspace model
- OAuth providers (Google, GitHub)
- Self-managed sessions with Edge runtime compatibility

**Benefits:**
- Complete cost elimination for authentication
- Full control over authentication flow
- No vendor lock-in
- Simpler data model without organizations

### 2. Removed Real-time Collaboration Infrastructure

**Before:**
- **Liveblocks**: Real-time collaboration service ($49/month for 5K MAU)
- **Convex**: Real-time database ($25/month for production)
- Complex WebSocket management
- Presence tracking and cursor broadcasting
- Conflict resolution for concurrent edits

**After:**
- **Zustand**: Local state management (free, open-source)
- **PostgreSQL + Prisma**: Traditional database (self-hosted)
- No WebSocket overhead
- Single-user focus with better performance
- Simplified architecture without conflict resolution needs

### 2. State Management Transformation

**Before (Liveblocks/Convex):**
```typescript
// Complex real-time state synchronization
const { storage, presence, others } = useMutation(...)
const layers = storage.get("layers")
const setLayers = useMutation(({ storage }, layers) => {
  storage.set("layers", layers)
})
```

**After (Zustand):**
```typescript
// Simple, efficient local state
const layers = useCanvasStore(state => state.layers)
const setLayers = useCanvasStore(state => state.setLayers)
```

### 3. Database Architecture

**Before (Convex):**
- NoSQL document store with real-time subscriptions
- Automatic synchronization across clients
- Built-in authentication integration
- Complex schema with presence tracking

**After (PostgreSQL + Prisma):**
```prisma
// Auth.js models
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  name          String?
  boards        Board[]
  favorites     UserFavorite[]
  accounts      Account[]
  sessions      Session[]
}

model Board {
  id          String   @id @default(cuid())
  title       String
  imageUrl    String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  canvasData  Json?    @default("{}") @db.JsonB  // Optimized JSONB storage
  isPublic    Boolean  @default(false)
  shareId     String?  @unique @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4. Performance Improvements

1. **Eliminated Network Latency**: All canvas operations are now local-first
2. **Reduced Bundle Size**: Removed Liveblocks and Convex SDKs (~200KB)
3. **Optimized Rendering**: No need to handle remote cursor positions or presence
4. **Better Undo/Redo**: Local history management with Zustand (max 50 entries)

### 5. Simplified Canvas Operations

**Before:**
- Every operation required network round-trip
- Complex conflict resolution for concurrent edits
- Presence tracking for multiple users
- Throttled updates to prevent API rate limits

**After:**
- Instant local operations
- Debounced persistence to database (1 second)
- No conflict resolution needed
- Unlimited local operations

## Migration Benefits

### Cost Savings
- **Clerk**: $74/month → $0
- **Liveblocks**: $49/month → $0
- **Convex**: $25/month → $0
- **Total**: $148/month → $0 (only hosting costs remain)

### Developer Experience
- Simpler mental model (no distributed systems complexity)
- Easier debugging (all state is local)
- Faster development cycles
- No API rate limits or quotas

### User Experience
- Instant responsiveness (no network latency)
- Works offline
- No connection issues
- Better performance on slower devices

## Technical Debt Addressed

1. **Removed WebSocket connection management**
2. **Eliminated race conditions in collaborative editing**
3. **Simplified error handling (no network errors for canvas operations)**
4. **Reduced API surface area**
5. **Removed presence tracking complexity**

## Future Opportunities

With the simplified architecture, we can now focus on:

1. **Enhanced Features**: AI-powered tools, advanced shapes, better export options
2. **Performance**: Canvas virtualization, WebGL rendering
3. **Local Storage**: IndexedDB for offline persistence
4. **Privacy**: All data stays on user's infrastructure

## Authentication Architecture

### Edge Runtime Compatibility
Auth.js v5 is configured with Edge runtime compatibility for optimal performance:

```typescript
// auth.config.ts - Edge-compatible configuration
export default {
  providers: [GoogleProvider, GitHubProvider],
  pages: { signIn: '/auth/signin', error: '/auth/error' },
  callbacks: { /* JWT-based session management */ }
} satisfies NextAuthConfig

// auth.ts - Node.js runtime with PrismaAdapter
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" }
})

// middleware.ts - Edge runtime protection
export default NextAuth(authConfig).auth
```

### Security Improvements
1. **No Account Linking Vulnerabilities**: Removed `allowDangerousEmailAccountLinking`
2. **Proper Authorization**: All API routes verify user ownership
3. **Configurable Routes**: Centralized auth route configuration

## Code Examples

### Before: Complex Collaborative Layer Creation
```typescript
const insertLayer = useMutation(
  ({ storage, setMyPresence }, layer) => {
    const layers = storage.get("layers")
    const layerIds = storage.get("layerIds")
    
    const id = nanoid()
    layers.set(id, layer)
    layerIds.push(id)
    
    setMyPresence({ selection: [id] })
    broadcast({ type: "LAYER_CREATED", layerId: id })
  },
  [broadcast]
)
```

### After: Simple Local Layer Creation
```typescript
insertLayer: (layer) => {
  get().saveHistory()
  set(state => {
    const id = nanoid()
    state.layers.set(id, { ...layer, id })
    state.layerIds.push(id)
    state.selectedLayers = [id]
  })
  get().saveToDatabase() // Debounced
}
```

## Conclusion

This architectural transformation demonstrates that not every application needs real-time collaboration. By focusing on single-user experience, we've created a faster, simpler, and more maintainable application while eliminating ongoing SaaS costs. The codebase is now more accessible to contributors and easier to deploy on any infrastructure.

## Related Documentation

- [Clerk to Auth.js Migration Guide](../CLERK_TO_AUTHJS_MIGRATION.md) - Detailed migration steps
- [Auth.js Setup Guide](../AUTHJS_SETUP_GUIDE.md) - Setup instructions for new installations
- [Main README](../../README.md) - Project overview and quick start