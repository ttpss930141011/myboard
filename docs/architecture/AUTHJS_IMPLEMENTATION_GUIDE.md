# Auth.js Implementation Guide for MyBoard

This guide provides step-by-step instructions for implementing Auth.js v5 in the MyBoard project, replacing Clerk.

## Step 1: Install Dependencies

```bash
# Remove Clerk dependencies
pnpm remove @clerk/nextjs

# Install Auth.js v5 and required dependencies
pnpm add next-auth@beta @auth/prisma-adapter
pnpm add -D @types/node
```

## Step 2: Environment Variables

Update `.env.local`:

```bash
# Remove Clerk variables
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# CLERK_SECRET_KEY=...

# Add Auth.js variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# Existing database
DATABASE_URL=your-existing-postgresql-url
```

## Step 3: Database Migration

Create a new migration file:

```bash
pnpm prisma migrate dev --name add-auth-models
```

Update `prisma/schema.prisma`:

```prisma
// Update existing models
model Board {
  id          String   @id @default(cuid())
  title       String
  imageUrl    String
  userId      String   // Changed from orgId
  authorName  String   // Keep for display
  
  // Add sharing features
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

// Add Auth.js models
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified DateTime?
  name          String?
  image         String?
  
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

## Step 4: Create Auth Configuration

Create `auth.ts` in the root directory:

```typescript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "@/lib/prisma"
import type { NextAuthConfig } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string | null
      name: string | null
      image: string | null
    }
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig)
```

## Step 5: Update Middleware

Replace `middleware.ts`:

```typescript
import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname
  
  // Public routes
  const isAuthPage = pathname.startsWith("/auth")
  const isPublicShare = pathname.startsWith("/board/share")
  const isPublicAsset = pathname.includes(".")
  
  // Allow public access
  if (isAuthPage || isPublicShare || isPublicAsset) {
    return NextResponse.next()
  }
  
  // Protect all other routes
  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

## Step 6: Create Auth Pages

Create `app/auth/signin/page.tsx`:

```typescript
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign in to MyBoard</CardTitle>
          <CardDescription>
            Choose your preferred sign-in method
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/" })
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </form>
          
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/" })
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 7: Update Providers

Update `app/providers.tsx`:

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

## Step 8: Create New Navigation Components

Create `app/(dashboard)/_components/user-menu.tsx`:

```typescript
"use client"

import { signOut } from "next-auth/react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"

export function UserMenu() {
  const { data: session } = useSession()
  
  if (!session?.user) return null
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={session.user.image || ""} />
          <AvatarFallback>
            {session.user.name?.[0] || session.user.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {session.user.name && (
              <p className="font-medium">{session.user.name}</p>
            )}
            {session.user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {session.user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

Update `app/(dashboard)/_components/navbar.tsx`:

```typescript
'use client'

import { SearchInput } from './search-input'
import { UserMenu } from './user-menu'

export const Navbar = () => {
  return (
    <div className="flex items-center gap-x-4 p-5">
      <div className="flex-1">
        <SearchInput />
      </div>
      <UserMenu />
    </div>
  )
}
```

## Step 9: Update API Routes

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/auth"

export const { GET, POST } = handlers
```

Update `app/api/boards/route.ts`:

```typescript
import { auth } from "@/auth"
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const favorites = searchParams.get('favorites')
    
    let boards
    
    if (favorites === 'true') {
      boards = await prisma.board.findMany({
        where: {
          userId: session.user.id,
          favorites: {
            some: { userId: session.user.id }
          }
        },
        include: {
          favorites: {
            where: { userId: session.user.id }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (search) {
      boards = await prisma.board.findMany({
        where: {
          userId: session.user.id,
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        include: {
          favorites: {
            where: { userId: session.user.id }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      boards = await prisma.board.findMany({
        where: { userId: session.user.id },
        include: {
          favorites: {
            where: { userId: session.user.id }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }
    
    // Transform to match existing format
    const transformedBoards = boards.map(board => ({
      _id: board.id,
      _creationTime: board.createdAt.getTime(),
      title: board.title,
      authorId: board.userId,
      authorName: board.authorName,
      imageUrl: board.imageUrl,
      isFavorite: board.favorites.length > 0
    }))
    
    return NextResponse.json(transformedBoards)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { title } = await request.json()
    
    if (!title || title.trim().length === 0) {
      return new Response('Title is required', { status: 400 })
    }
    
    if (title.length > 60) {
      return new Response('Title cannot be longer than 60 characters', { status: 400 })
    }
    
    const images = [
      '/placeholders/1.svg',
      '/placeholders/2.svg',
      '/placeholders/3.svg',
      '/placeholders/4.svg',
      '/placeholders/5.svg',
      '/placeholders/6.svg',
      '/placeholders/7.svg',
      '/placeholders/8.svg',
      '/placeholders/9.svg',
      '/placeholders/10.svg',
    ]
    
    const randomImage = images[Math.floor(Math.random() * images.length)]
    
    const board = await prisma.board.create({
      data: {
        title: title.trim(),
        userId: session.user.id,
        authorName: session.user.name || 'User',
        imageUrl: randomImage,
        canvasData: {
          layers: {},
          layerIds: []
        }
      }
    })
    
    return NextResponse.json({
      _id: board.id,
      _creationTime: board.createdAt.getTime(),
      title: board.title,
      authorId: board.userId,
      authorName: board.authorName,
      imageUrl: board.imageUrl
    })
  } catch (error) {
    console.error('Error creating board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
```

## Step 10: Update Hooks

Update `hooks/api/use-boards.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Board {
  _id: string
  _creationTime: number
  title: string
  authorId: string
  authorName: string
  imageUrl: string
  isFavorite?: boolean
}

export function useBoards(options?: { search?: string, favorites?: boolean }) {
  const { data: session } = useSession()
  
  return useQuery<Board[]>({
    queryKey: ['boards', session?.user?.id, options],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(options?.search && { search: options.search }),
        ...(options?.favorites && { favorites: 'true' })
      })
      
      const res = await fetch(`/api/boards?${params}`)
      if (!res.ok) throw new Error('Failed to fetch boards')
      return res.json()
    },
    enabled: !!session?.user?.id,
  })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      
      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to create board')
      }
      
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards', session?.user?.id] })
      toast.success('Board created!')
      router.push(`/board/${data._id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create board')
    },
  })
}
```

## Data Migration Script

Create `scripts/migrate-clerk-to-authjs.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateData() {
  console.log('Starting migration from Clerk to Auth.js...')
  
  // This is a placeholder - you'll need to:
  // 1. Export user data from Clerk
  // 2. Map Clerk user IDs to new Auth.js user IDs
  // 3. Update all board records to use new user IDs
  
  // Example migration (adjust based on your data):
  // const boards = await prisma.board.findMany()
  // for (const board of boards) {
  //   await prisma.board.update({
  //     where: { id: board.id },
  //     data: { 
  //       userId: mapClerkIdToAuthJsId(board.orgId),
  //       shareId: generateShareId()
  //     }
  //   })
  // }
  
  console.log('Migration completed!')
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## Testing Checklist

- [ ] User can sign in with Google
- [ ] User can sign in with GitHub
- [ ] User session persists across page refreshes
- [ ] User can create new boards
- [ ] User can view their boards
- [ ] User can favorite/unfavorite boards
- [ ] User can search boards
- [ ] User can sign out
- [ ] Protected routes redirect to sign in
- [ ] Share links work without authentication

## Deployment Notes

1. Update OAuth redirect URLs in Google/GitHub to include production domain
2. Generate secure `NEXTAUTH_SECRET` for production
3. Ensure database migrations are run before deployment
4. Test OAuth flows in production environment

This implementation provides a complete authentication solution using Auth.js v5, removing the Clerk dependency while maintaining all essential functionality for your personal whiteboard application.