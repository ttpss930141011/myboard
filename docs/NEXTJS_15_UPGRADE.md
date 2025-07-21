# Next.js 15 Upgrade Guide

This document details the upgrade from Next.js 14.1.1 to Next.js 15.4.2 in the MyBoard project.

## Overview

We successfully upgraded to Next.js 15, which includes React 19 RC support and several performance improvements. The upgrade was relatively smooth thanks to the Next.js codemod tool.

## Key Changes

### 1. Dependencies Updated

```json
{
  "dependencies": {
    "next": "15.4.2",        // was 14.1.1
    "react": "19.0.0-rc.1",  // was 18.3.1
    "react-dom": "19.0.0-rc.1"  // was 18.3.1
  },
  "devDependencies": {
    "@types/react": "^19.1.8",  // was ^18
    "@types/react-dom": "^19.1.6",  // was ^18
    "eslint-config-next": "15.4.2"  // was 14.1.0
  }
}
```

### 2. Breaking Changes Addressed

#### Async Request APIs
The most significant breaking change in Next.js 15 is that `params` and `searchParams` are now asynchronous. The codemod automatically updated:

**Before (Next.js 14):**
```typescript
// Page component
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}

// API route
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  // ...
}
```

**After (Next.js 15):**
```typescript
// Server component
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <div>{params.id}</div>
}

// Client component with searchParams
'use client'
import { use } from 'react'

export default function Page(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = use(props.searchParams)
  return <div>{searchParams.q}</div>
}

// API route
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = params.id
  // ...
}
```

#### React 19 useRef Changes
React 19 RC requires an initial value for `useRef()`. We fixed:

```typescript
// Before
const rafRef = useRef<number>()
const timeoutRef = useRef<NodeJS.Timeout>()

// After
const rafRef = useRef<number>(0)
const timeoutRef = useRef<NodeJS.Timeout | null>(null)
```

### 3. Caching Changes

Next.js 15 no longer caches `fetch` requests and Route Handlers by default. This is actually beneficial for our use case as we want fresh data for the whiteboard application.

### 4. Performance Improvements

Next.js 15 includes:
- Faster build times
- Improved HMR (Hot Module Replacement)
- Better tree-shaking
- Smaller client-side JavaScript bundles

## Migration Steps Performed

1. **Updated dependencies** using pnpm:
   ```bash
   pnpm add next@15 react@rc react-dom@rc eslint-config-next@15
   pnpm add -D @types/react@^19 @types/react-dom@^19
   ```

2. **Ran the Next.js codemod**:
   ```bash
   npx @next/codemod@latest next-async-request-api .
   ```
   This automatically updated 8 files to handle async params/searchParams.

3. **Fixed TypeScript errors** related to React 19's stricter `useRef` typing.

4. **Tested the application** to ensure all functionality works correctly.

## Files Modified

The codemod updated these files:
- `app/(dashboard)/page.tsx` - Client component using `use()` hook
- `app/board/[boardId]/page.tsx` - Server component with async params
- `app/board/share/[shareId]/page.tsx` - Server component with async params
- `app/auth/error/page.tsx` - Server component with async searchParams
- `app/api/boards/[boardId]/route.ts` - API route with async params
- `app/api/boards/[boardId]/canvas/route.ts` - API route with async params
- `app/api/boards/[boardId]/favorite/route.ts` - API route with async params
- `app/api/boards/[boardId]/share/route.ts` - API route with async params

Manual fixes were needed for:
- `app/board/[boardId]/_components/canvas.tsx` - useRef initial value
- `hooks/use-throttled-callback.ts` - useRef typing
- `app/board/[boardId]/_components/selection-tools.tsx` - useMemo dependency

## Testing Checklist

✅ Application builds successfully (`pnpm run build`)
✅ Development server runs without errors (`pnpm run dev`)
✅ No TypeScript errors (`pnpm exec tsc --noEmit`)
✅ No ESLint errors (`pnpm run lint`)
✅ Board creation and editing works
✅ Authentication flow works correctly
✅ Share functionality works as expected

## Known Issues

Currently, there are peer dependency warnings for:
- `lucide-react` - Doesn't officially support React 19 yet
- `usehooks-ts` - Doesn't officially support React 19 yet

These libraries work fine with React 19 RC, but may show warnings during installation. These warnings can be safely ignored for now.

## Benefits of the Upgrade

1. **Better Performance**: Next.js 15 provides faster builds and better runtime performance
2. **React 19 Features**: Access to new React features like the `use()` hook
3. **Improved Developer Experience**: Faster HMR and better error messages
4. **Future-Proof**: Staying up-to-date with the latest Next.js features and security updates

## Rollback Plan

If issues arise, the upgrade can be reverted by:
1. Checking out the previous commit
2. Running `pnpm install` to restore previous dependencies
3. Reverting the async params/searchParams changes

However, the upgrade has been thoroughly tested and is considered stable.

## References

- [Next.js 15 Blog Post](https://nextjs.org/blog/next-15)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [React 19 RC Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-rc)