# BoardWex Migration Guide: From Convex/Liveblocks to Zustand/Prisma/PostgreSQL

## Overview

This guide provides a complete migration plan to remove Convex and Liveblocks dependencies from BoardWex, replacing them with a self-hosted solution using Zustand for state management and PostgreSQL with Prisma for data persistence.

## Architecture Comparison

### Current Architecture
- **Real-time Collaboration**: Liveblocks
- **Database & API**: Convex
- **Authentication**: Clerk (unchanged)
- **State Management**: Liveblocks (collaborative) + Convex (persistent) + Zustand (UI)

### New Architecture
- **State Management**: Zustand (local state + canvas)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: Next.js API Routes
- **Authentication**: Clerk (unchanged)
- **Data Fetching**: React Query

## 1. Database Schema Design

### PostgreSQL Schema with Prisma

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Board {
  id          String   @id @default(cuid())
  title       String
  imageUrl    String
  orgId       String
  authorId    String
  authorName  String
  
  // Canvas data stored as JSON
  canvasData  Json?    @default("{}")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  favorites   UserFavorite[]
  
  // Indexes for performance
  @@index([orgId])
  @@index([authorId])
  @@index([title])
}

model UserFavorite {
  id        String   @id @default(cuid())
  userId    String
  boardId   String
  orgId     String
  
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([userId, boardId])
  @@index([userId, orgId])
}

// Optional: Store canvas history for undo/redo persistence
model CanvasHistory {
  id          String   @id @default(cuid())
  boardId     String
  userId      String
  action      String   // "create", "update", "delete"
  data        Json     // Changed data
  timestamp   DateTime @default(now())
  
  @@index([boardId])
}
```

## 2. API Routes Structure

### Board Operations

```typescript
// app/api/boards/route.ts
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { userId, orgId } = auth()
  if (!userId || !orgId) return new Response('Unauthorized', { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const favorites = searchParams.get('favorites')
  
  let boards
  
  if (favorites === 'true') {
    boards = await prisma.board.findMany({
      where: {
        orgId,
        favorites: {
          some: { userId }
        }
      },
      include: {
        favorites: {
          where: { userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } else if (search) {
    boards = await prisma.board.findMany({
      where: {
        orgId,
        title: {
          contains: search,
          mode: 'insensitive'
        }
      },
      include: {
        favorites: {
          where: { userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } else {
    boards = await prisma.board.findMany({
      where: { orgId },
      include: {
        favorites: {
          where: { userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
  
  // Transform to match existing format
  const transformedBoards = boards.map(board => ({
    ...board,
    isFavorite: board.favorites.length > 0
  }))
  
  return Response.json(transformedBoards)
}

export async function POST(request: Request) {
  const { userId, orgId } = auth()
  const user = await currentUser()
  if (!userId || !orgId || !user) return new Response('Unauthorized', { status: 401 })
  
  const { title } = await request.json()
  
  const board = await prisma.board.create({
    data: {
      title,
      orgId,
      authorId: userId,
      authorName: user.firstName || 'User',
      imageUrl: `/placeholders/${Math.floor(Math.random() * 10) + 1}.svg`,
      canvasData: {
        layers: {},
        layerIds: []
      }
    }
  })
  
  return Response.json(board)
}
```

```typescript
// app/api/boards/[boardId]/route.ts
export async function GET(request: Request, { params }: { params: { boardId: string } }) {
  const board = await prisma.board.findUnique({
    where: { id: params.boardId }
  })
  
  if (!board) return new Response('Not found', { status: 404 })
  
  return Response.json(board)
}

export async function PATCH(request: Request, { params }: { params: { boardId: string } }) {
  const { userId, orgId } = auth()
  if (!userId || !orgId) return new Response('Unauthorized', { status: 401 })
  
  const { title } = await request.json()
  
  // Verify ownership
  const board = await prisma.board.findFirst({
    where: {
      id: params.boardId,
      orgId
    }
  })
  
  if (!board) return new Response('Not found', { status: 404 })
  
  const updated = await prisma.board.update({
    where: { id: params.boardId },
    data: { title }
  })
  
  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: { params: { boardId: string } }) {
  const { userId, orgId } = auth()
  if (!userId || !orgId) return new Response('Unauthorized', { status: 401 })
  
  const board = await prisma.board.findFirst({
    where: {
      id: params.boardId,
      orgId
    }
  })
  
  if (!board) return new Response('Not found', { status: 404 })
  
  await prisma.board.delete({
    where: { id: params.boardId }
  })
  
  return new Response(null, { status: 204 })
}
```

```typescript
// app/api/boards/[boardId]/canvas/route.ts
export async function GET(request: Request, { params }: { params: { boardId: string } }) {
  const board = await prisma.board.findUnique({
    where: { id: params.boardId },
    select: { canvasData: true }
  })
  
  if (!board) return new Response('Not found', { status: 404 })
  
  return Response.json(board.canvasData)
}

export async function PUT(request: Request, { params }: { params: { boardId: string } }) {
  const { userId, orgId } = auth()
  if (!userId || !orgId) return new Response('Unauthorized', { status: 401 })
  
  const canvasData = await request.json()
  
  const board = await prisma.board.findFirst({
    where: {
      id: params.boardId,
      orgId
    }
  })
  
  if (!board) return new Response('Not found', { status: 404 })
  
  await prisma.board.update({
    where: { id: params.boardId },
    data: { canvasData }
  })
  
  return new Response(null, { status: 204 })
}
```

## 3. State Management with Zustand

### Canvas Store

```typescript
// stores/canvas-store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import { debounce } from 'lodash'
import { nanoid } from 'nanoid'
import { 
  Layer, 
  Camera, 
  Color, 
  CanvasMode, 
  CanvasState,
  Point,
  XYWH,
  LayerType
} from '@/types/canvas'

interface CanvasStore {
  // Canvas state
  layers: Map<string, Layer>
  layerIds: string[]
  
  // Local state
  camera: Camera
  selectedLayers: string[]
  canvasState: CanvasState
  penColor: Color
  
  // Layer operations
  insertLayer: (layer: Omit<Layer, 'id'>) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  deleteLayer: (id: string) => void
  deleteLayers: (ids: string[]) => void
  reorderLayers: (layerIds: string[]) => void
  
  // Selection operations
  selectLayers: (ids: string[]) => void
  unselectLayers: () => void
  
  // Canvas operations
  translateLayers: (ids: string[], offset: Point) => void
  resizeLayer: (id: string, bounds: XYWH) => void
  
  // Canvas state
  setCanvasState: (state: CanvasState) => void
  setCamera: (camera: Camera) => void
  setPenColor: (color: Color) => void
  
  // Persistence
  saveToDatabase: () => void
  loadFromDatabase: (data: any) => void
  
  // Utilities
  getLayer: (id: string) => Layer | undefined
  getSelectedLayers: () => Layer[]
}

export const useCanvasStore = create<CanvasStore>()(
  temporal(
    immer((set, get) => ({
      layers: new Map(),
      layerIds: [],
      camera: { x: 0, y: 0 },
      selectedLayers: [],
      canvasState: { mode: CanvasMode.None },
      penColor: { r: 0, g: 0, b: 0 },
      
      insertLayer: (layer) => set(state => {
        const id = nanoid()
        const newLayer = { ...layer, id }
        state.layers.set(id, newLayer)
        state.layerIds.push(id)
        
        // Auto-save
        get().saveToDatabase()
      }),
      
      updateLayer: (id, updates) => set(state => {
        const layer = state.layers.get(id)
        if (layer) {
          state.layers.set(id, { ...layer, ...updates })
          get().saveToDatabase()
        }
      }),
      
      deleteLayer: (id) => set(state => {
        state.layers.delete(id)
        state.layerIds = state.layerIds.filter(layerId => layerId !== id)
        state.selectedLayers = state.selectedLayers.filter(layerId => layerId !== id)
        get().saveToDatabase()
      }),
      
      deleteLayers: (ids) => set(state => {
        ids.forEach(id => {
          state.layers.delete(id)
        })
        state.layerIds = state.layerIds.filter(id => !ids.includes(id))
        state.selectedLayers = state.selectedLayers.filter(id => !ids.includes(id))
        get().saveToDatabase()
      }),
      
      reorderLayers: (layerIds) => set(state => {
        state.layerIds = layerIds
        get().saveToDatabase()
      }),
      
      selectLayers: (ids) => set(state => {
        state.selectedLayers = ids
      }),
      
      unselectLayers: () => set(state => {
        state.selectedLayers = []
      }),
      
      translateLayers: (ids, offset) => set(state => {
        ids.forEach(id => {
          const layer = state.layers.get(id)
          if (layer) {
            state.layers.set(id, {
              ...layer,
              x: layer.x + offset.x,
              y: layer.y + offset.y
            })
          }
        })
        get().saveToDatabase()
      }),
      
      resizeLayer: (id, bounds) => set(state => {
        const layer = state.layers.get(id)
        if (layer) {
          state.layers.set(id, {
            ...layer,
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
          })
          get().saveToDatabase()
        }
      }),
      
      setCanvasState: (canvasState) => set(state => {
        state.canvasState = canvasState
      }),
      
      setCamera: (camera) => set(state => {
        state.camera = camera
      }),
      
      setPenColor: (color) => set(state => {
        state.penColor = color
      }),
      
      // Debounced save to database
      saveToDatabase: debounce(async () => {
        const state = get()
        const canvasData = {
          layers: Object.fromEntries(state.layers),
          layerIds: state.layerIds,
        }
        
        // Get boardId from URL
        const boardId = window.location.pathname.split('/').pop()
        if (!boardId) return
        
        await fetch(`/api/boards/${boardId}/canvas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(canvasData),
        })
      }, 1000),
      
      loadFromDatabase: (data) => set(state => {
        state.layers = new Map(Object.entries(data.layers || {}))
        state.layerIds = data.layerIds || []
      }),
      
      getLayer: (id) => get().layers.get(id),
      
      getSelectedLayers: () => {
        const state = get()
        return state.selectedLayers
          .map(id => state.layers.get(id))
          .filter(Boolean) as Layer[]
      },
    })),
    {
      limit: 50, // Keep 50 history steps
    }
  )
)

// Undo/redo hooks
export const useCanvasHistory = () => {
  const { undo, redo, canUndo, canRedo } = useCanvasStore.temporal.getState()
  return { undo, redo, canUndo, canRedo }
}
```

## 4. Data Fetching with React Query

### Board Hooks

```typescript
// hooks/use-boards.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useBoards(orgId: string, options?: { search?: string, favorites?: boolean }) {
  return useQuery({
    queryKey: ['boards', orgId, options],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        orgId,
        ...(options?.search && { search: options.search }),
        ...(options?.favorites && { favorites: 'true' })
      })
      const res = await fetch(`/api/boards?${params}`)
      if (!res.ok) throw new Error('Failed to fetch boards')
      return res.json()
    },
  })
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`)
      if (!res.ok) throw new Error('Failed to fetch board')
      return res.json()
    },
  })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ title, orgId }: { title: string, orgId: string }) => {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, orgId }),
      })
      if (!res.ok) throw new Error('Failed to create board')
      return res.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', variables.orgId] })
    },
  })
}

export function useUpdateBoard(boardId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed to update board')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

export function useDeleteBoard(boardId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete board')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}
```

### Canvas Hook

```typescript
// hooks/use-canvas.ts
import { useQuery } from '@tanstack/react-query'
import { useCanvasStore } from '@/stores/canvas-store'

export function useCanvas(boardId: string) {
  const loadFromDatabase = useCanvasStore(state => state.loadFromDatabase)
  
  return useQuery({
    queryKey: ['canvas', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/canvas`)
      if (!res.ok) throw new Error('Failed to fetch canvas')
      const data = await res.json()
      loadFromDatabase(data)
      return data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
```

### Favorite Hooks

```typescript
// hooks/use-favorites.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useFavoriteBoard(boardId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ orgId }: { orgId: string }) => {
      const res = await fetch(`/api/boards/${boardId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      if (!res.ok) throw new Error('Failed to favorite board')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', variables.orgId] })
    },
  })
}

export function useUnfavoriteBoard(boardId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ orgId }: { orgId: string }) => {
      const res = await fetch(`/api/boards/${boardId}/favorite`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to unfavorite board')
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', variables.orgId] })
    },
  })
}
```

## 5. Component Migration Examples

### Canvas Component Migration

```typescript
// Before (with Liveblocks)
import { useMutation, useStorage, useOthersMapped } from '@/liveblocks.config'

const insertLayer = useMutation(({ storage }, layerType, position) => {
  const layers = storage.get('layers')
  const layerIds = storage.get('layerIds')
  // ... implementation
})

// After (with Zustand)
import { useCanvasStore } from '@/stores/canvas-store'

export function Canvas({ boardId }: { boardId: string }) {
  const { insertLayer, layers, layerIds } = useCanvasStore()
  const { isLoading } = useCanvas(boardId) // Load canvas data
  
  const handleInsertLayer = (layerType: LayerType, position: Point) => {
    insertLayer({
      type: layerType,
      x: position.x,
      y: position.y,
      width: 100,
      height: 100,
      fill: lastUsedColor,
    })
  }
  
  if (isLoading) return <CanvasSkeleton />
  
  // ... rest of component
}
```

### Selection Tools Migration

```typescript
// Before
const deleteLayers = useDeleteLayers()
const selectionBounds = useSelectionBounds()

// After
import { useCanvasStore } from '@/stores/canvas-store'

export function SelectionTools() {
  const { selectedLayers, deleteLayers, getSelectedLayers } = useCanvasStore()
  
  const handleDelete = () => {
    deleteLayers(selectedLayers)
  }
  
  // Calculate bounds from selected layers
  const bounds = useMemo(() => {
    const layers = getSelectedLayers()
    if (layers.length === 0) return null
    // ... calculate bounds
  }, [selectedLayers])
  
  // ... rest of component
}
```

## 6. Implementation Roadmap

### Phase 1: Infrastructure Setup (4-6 hours)
1. Set up PostgreSQL database (local or cloud)
2. Initialize Prisma with schema
3. Create database client configuration
4. Set up React Query provider
5. Configure environment variables

### Phase 2: State Management Migration (8-10 hours)
1. Create Zustand canvas store
2. Implement all canvas operations
3. Add undo/redo functionality
4. Implement auto-save mechanism
5. Create helper hooks

### Phase 3: API Migration (6-8 hours)
1. Create all API routes
2. Implement board CRUD operations
3. Implement favorite functionality
4. Add search functionality
5. Implement canvas persistence

### Phase 4: Component Updates (10-12 hours)
1. Remove Liveblocks providers
2. Update Canvas component
3. Update toolbar components
4. Update board list components
5. Update selection tools
6. Remove presence/cursor components

### Phase 5: Testing & Optimization (4-6 hours)
1. Functional testing
2. Performance optimization
3. Error handling improvements
4. Remove old dependencies
5. Clean up unused code

**Total estimated time: 32-42 hours**

## 7. Environment Variables

Update your `.env.local` file:

```bash
# Remove these
# CONVEX_DEPLOYMENT=
# NEXT_PUBLIC_CONVEX_URL=
# LIVEBLOCKS_SECRET_KEY=

# Add these
DATABASE_URL="postgresql://user:password@localhost:5432/boardwex"
# or use a cloud provider
# DATABASE_URL="postgresql://user:password@host.region.provider.com:5432/boardwex?sslmode=require"

# Keep these
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## 8. Deployment Options

### Database Hosting
- **Supabase**: Free tier with 500MB
- **Neon**: Free tier with 3GB
- **Railway**: $5/month for PostgreSQL
- **PlanetScale**: MySQL alternative with free tier

### Application Hosting
- **Vercel**: Best for Next.js apps
- **Railway**: Full-stack deployment
- **Render**: Alternative with free tier

### File Storage (if needed)
- **Cloudinary**: For image uploads
- **AWS S3**: For general file storage
- **Supabase Storage**: If using Supabase

## 9. Migration Checklist

- [ ] Set up PostgreSQL database
- [ ] Initialize Prisma and run migrations
- [ ] Create API routes for boards
- [ ] Create API routes for favorites
- [ ] Create API routes for canvas
- [ ] Implement Zustand store
- [ ] Add undo/redo functionality
- [ ] Implement auto-save
- [ ] Update Canvas component
- [ ] Update board list components
- [ ] Update toolbar components
- [ ] Remove Liveblocks components
- [ ] Remove Convex configuration
- [ ] Update environment variables
- [ ] Test all functionality
- [ ] Deploy to production

## 10. Potential Issues & Solutions

### Issue: Large Canvas Data
**Problem**: Canvas data might exceed PostgreSQL JSON column limits  
**Solution**: 
- Compress canvas data before saving
- Split into multiple columns if needed
- Use PostgreSQL JSONB for better performance

### Issue: Concurrent Edits
**Problem**: Multiple browser tabs editing same board  
**Solution**: 
- Implement optimistic locking
- Use timestamps for conflict detection
- Show warning when data is stale

### Issue: Performance with Many Layers
**Problem**: Large canvases might be slow  
**Solution**: 
- Implement virtualization
- Lazy load layers outside viewport
- Use Web Workers for heavy calculations

## Conclusion

This migration removes all real-time collaboration features but maintains full functionality for single-user whiteboard usage. The new architecture is:
- ✅ Free to host (within free tiers)
- ✅ No user limits
- ✅ Full control over data
- ✅ Self-hostable
- ✅ No vendor lock-in

The migration requires significant effort but results in a simpler, more maintainable architecture suitable for individual use.