# Clerk to Auth.js (NextAuth v5) Migration Report

## Executive Summary

This report outlines the comprehensive migration plan from Clerk to Auth.js (NextAuth v5) for the Personal Miro whiteboard application. The migration will remove the paid Clerk dependency while maintaining authentication functionality, simplified for a single-user focused application with read-only sharing capabilities.

## Current State Analysis

### Clerk Integration Points

1. **Authentication Layer**
   - Middleware: `authMiddleware()` protecting all routes
   - Provider: `<ClerkProvider>` wrapping the application
   - Auth hooks: `useAuth()`, `useOrganization()`, `useOrganizationList()`

2. **Organization System**
   - Multi-tenancy with organization switching
   - Organization-based data isolation
   - Member management and invitations

3. **API Protection**
   - Server-side: `auth()` and `currentUser()` functions
   - All API routes verify `userId` and `orgId`

4. **UI Components**
   - `<UserButton />` - User profile menu
   - `<OrganizationSwitcher />` - Organization selector
   - `<OrganizationProfile />` - Organization management
   - `<CreateOrganization />` - Organization creation

## Migration Strategy

### Phase 1: Remove Organization Complexity

Since collaboration has been removed, organizations are unnecessary overhead. We'll migrate to a simpler user-based model.

#### Database Schema Changes

```prisma
// Remove organization-related fields from existing models
model Board {
  id          String   @id @default(cuid())
  title       String
  imageUrl    String
  userId      String   // Changed from orgId
  authorName  String
  
  // Sharing features
  isPublic    Boolean  @default(false)
  shareId     String?  @unique @default(cuid())
  
  canvasData  Json?    @default("{}") @db.JsonB
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
  favorites   UserFavorite[]
  
  @@index([userId])
  @@index([shareId])
}

model UserFavorite {
  id        String   @id @default(cuid())
  userId    String
  boardId   String
  
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@unique([userId, boardId])
  @@index([userId])
}

// Add Auth.js required models
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified DateTime?
  name          String?
  image         String?
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  boards        Board[]
  favorites     UserFavorite[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Phase 2: Auth.js Setup

#### 1. Install Dependencies

```bash
pnpm add next-auth@beta @auth/prisma-adapter
pnpm add -D @types/node
```

#### 2. Create Core Auth Configuration

```typescript
// auth.ts (root directory)
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "@/lib/prisma"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig)
```

#### 3. Create Middleware

```typescript
// middleware.ts
import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isPublicShare = req.nextUrl.pathname.startsWith("/board/share")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")
  
  // Allow public access to shared boards
  if (isPublicShare) {
    return NextResponse.next()
  }
  
  // Redirect unauthenticated users to sign in
  if (!isLoggedIn && !isAuthPage && !isApiRoute) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
```

#### 4. Create API Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"

export const { GET, POST } = handlers
```

#### 5. Update Provider

```typescript
// app/providers.tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

### Phase 3: API Routes Migration

#### Before (Clerk):
```typescript
// app/api/boards/route.ts
import { auth, currentUser } from '@clerk/nextjs'

export async function GET() {
  const { userId, orgId } = auth()
  if (!userId || !orgId) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... fetch boards by orgId
}
```

#### After (Auth.js):
```typescript
// app/api/boards/route.ts
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const boards = await prisma.board.findMany({
    where: { userId: session.user.id },
    include: {
      favorites: {
        where: { userId: session.user.id }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(boards)
}
```

### Phase 4: Component Migration

#### Navigation Component
```typescript
// components/navbar.tsx
import { auth, signOut } from "@/auth"
import { SignInButton } from "./sign-in-button"
import { UserMenu } from "./user-menu"

export async function Navbar() {
  const session = await auth()
  
  return (
    <nav className="flex items-center justify-between p-4">
      <Logo />
      {session ? (
        <UserMenu user={session.user} />
      ) : (
        <SignInButton />
      )}
    </nav>
  )
}
```

#### User Menu Component
```typescript
// components/user-menu.tsx
"use client"

import { signOut } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserMenu({ user }: { user: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.image} />
          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{user.email}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Phase 5: Hooks Migration

#### Before (Clerk):
```typescript
// hooks/api/use-boards.ts
import { useOrganization } from '@clerk/nextjs'

export function useBoards() {
  const { organization } = useOrganization()
  
  return useQuery({
    queryKey: ['boards', organization?.id],
    queryFn: async () => {
      // ... fetch with orgId
    },
    enabled: !!organization?.id,
  })
}
```

#### After (Auth.js):
```typescript
// hooks/api/use-boards.ts
import { useSession } from 'next-auth/react'

export function useBoards() {
  const { data: session } = useSession()
  
  return useQuery({
    queryKey: ['boards', session?.user?.id],
    queryFn: async () => {
      const res = await fetch('/api/boards')
      if (!res.ok) throw new Error('Failed to fetch boards')
      return res.json()
    },
    enabled: !!session?.user?.id,
  })
}
```

### Phase 6: Sharing Implementation

```typescript
// app/board/share/[shareId]/page.tsx
import { Canvas } from "@/components/canvas"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

interface SharePageProps {
  params: { shareId: string }
}

export default async function SharePage({ params }: SharePageProps) {
  const board = await prisma.board.findUnique({
    where: { 
      shareId: params.shareId,
      isPublic: true 
    }
  })
  
  if (!board) {
    notFound()
  }
  
  return (
    <div className="h-screen">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">{board.title} (Read-only)</h1>
      </div>
      <Canvas 
        boardId={board.id}
        initialData={board.canvasData}
        mode="readonly"
      />
    </div>
  )
}
```

## Migration Timeline

### Week 1: Foundation
- Day 1-2: Set up Auth.js, create auth pages
- Day 3-4: Migrate database schema
- Day 5: Implement middleware and API route protection

### Week 2: Feature Migration
- Day 1-2: Migrate all API routes
- Day 3-4: Update React components and hooks
- Day 5: Implement sharing functionality

### Week 3: Testing & Deployment
- Day 1-2: Comprehensive testing
- Day 3: Data migration script
- Day 4-5: Production deployment

## Environment Variables

### Remove (Clerk):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_JWT_ISSUER_DOMAIN
```

### Add (Auth.js):
```
# Auth.js
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

## Cost Analysis

### Before:
- Clerk Free Tier: 10,000 MAU
- After 10K MAU: ~$0.02 per MAU
- Organization features: Additional cost

### After:
- Auth.js: $0 (open source)
- OAuth providers: Free tier sufficient
- Total: $0

## Benefits

1. **Cost Savings**: Eliminate all authentication costs
2. **Simplicity**: Remove organization complexity
3. **Control**: Full ownership of auth logic
4. **Privacy**: All user data on your infrastructure
5. **Flexibility**: Customize as needed

## Risks & Mitigations

1. **Security**: Implement rate limiting, CSRF protection
2. **Session Management**: Use secure session configuration
3. **OAuth Setup**: Properly configure redirect URLs
4. **Data Migration**: Test migration script thoroughly

## Conclusion

This migration from Clerk to Auth.js aligns perfectly with the personal whiteboard vision, removing unnecessary complexity while maintaining essential authentication features. The simplified architecture will be easier to maintain and completely free to operate.