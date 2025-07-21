# Clerk to Auth.js Migration Guide

This document details the complete migration from Clerk authentication to Auth.js v5 (NextAuth) in the Personal Miro project.

## Migration Overview

We successfully migrated from Clerk (a paid authentication service costing $74/month) to Auth.js v5, an open-source authentication solution. This migration also simplified our architecture by removing organization-based multi-tenancy in favor of a single-user workspace model.

## Key Changes

### 1. Authentication Provider Change

**Before (Clerk):**
- Paid service with usage-based pricing
- Built-in organization management
- Proprietary SDK and components

**After (Auth.js v5):**
- Free, open-source solution
- OAuth providers (Google, GitHub)
- Standard NextAuth patterns

### 2. Architecture Simplification

**Removed:**
- Organization concept (`orgId`)
- Team collaboration features
- Member invitations
- Organization switching

**Added:**
- Direct user ownership (`userId`)
- Personal workspace model
- Public board sharing with read-only links

### 3. Database Schema Updates

```prisma
// Before
model Board {
  orgId       String
  // ...
}

// After
model Board {
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  isPublic    Boolean  @default(false)
  shareId     String?  @unique @default(cuid())
  // ...
}
```

## Migration Steps Performed

### 1. Dependencies Update

```bash
# Removed
- @clerk/nextjs

# Added
+ next-auth@5.0.0-beta.29
+ @auth/prisma-adapter
```

### 2. Auth Configuration

Created three key files following Auth.js Edge compatibility pattern:

- `auth.config.ts` - Edge-compatible configuration
- `auth.ts` - Main auth instance with PrismaAdapter
- `auth-edge.ts` - Edge runtime instance for middleware

### 3. Environment Variables

```env
# Removed
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLERK_JWT_ISSUER_DOMAIN

# Added
+ NEXTAUTH_URL
+ NEXTAUTH_SECRET
+ GOOGLE_CLIENT_ID
+ GOOGLE_CLIENT_SECRET
+ GITHUB_ID
+ GITHUB_SECRET
```

### 4. Component Updates

All components were updated to use NextAuth hooks:
- `useSession()` instead of `useOrganization()`
- `SessionProvider` instead of `ClerkProvider`
- Custom `UserMenu` instead of `OrganizationSwitcher`

### 5. API Route Updates

All API routes now use the `AuthService` class for authentication:

```typescript
const user = await AuthService.requireAuth()
```

### 6. Middleware Update

Replaced Clerk middleware with Auth.js Edge-compatible middleware for route protection.

## Security Improvements

1. **Removed `allowDangerousEmailAccountLinking`** - Prevents account takeover vulnerabilities
2. **Implemented proper authorization checks** - All API routes verify user ownership
3. **Added configurable auth routes** - Centralized route configuration in constants

## Breaking Changes

1. **No Organization Support** - All boards are now personal
2. **No Team Features** - Removed team collaboration, member invites
3. **User Data Reset Required** - Existing users need to re-register with OAuth

## New Features

1. **Public Board Sharing** - Boards can be made public with read-only access
2. **OAuth Authentication** - Support for Google and GitHub sign-in
3. **Simplified UI** - Cleaner interface without organization complexity

## Data Migration

For this project, we chose to reset the database since it was still in development:

```bash
pnpm prisma db push --force-reset
```

For production migrations, a migration script was created (but not used) that would:
1. Create a default user for orphaned boards
2. Update all boards to the default user
3. Require users to claim their boards after OAuth sign-in

## Testing the Migration

1. Sign in with Google or GitHub
2. Create new boards
3. Test board sharing functionality
4. Verify all CRUD operations work correctly

## Rollback Plan

If issues arise, the migration can be reverted by:
1. Restoring the Clerk dependencies
2. Reverting the database schema
3. Restoring the original component code

However, this migration has been thoroughly tested and is considered stable.

## Cost Savings

- **Clerk**: $74/month (with potential usage-based increases)
- **Auth.js**: $0/month (self-hosted)
- **Annual Savings**: $888/year

## Future Considerations

1. **Account Linking** - Could implement manual account linking if needed
2. **Additional Providers** - Easy to add more OAuth providers
3. **Email Authentication** - Could add magic link authentication
4. **2FA** - Could implement two-factor authentication

## Related Documentation

- [Auth.js Setup Guide](./AUTHJS_SETUP_GUIDE.md) - Step-by-step setup instructions
- [Architecture Changes](./architecture/ARCHITECTURE_CHANGES.md) - Overall architecture transformation
- [Main README](../README.md) - Project overview and quick start

## References

- [Auth.js Documentation](https://authjs.dev/)
- [Edge Compatibility Guide](https://authjs.dev/guides/edge-compatibility)
- [PR #6 - Remove Clerk and implement Auth.js v5](https://github.com/ttpss930141011/personal-miro/pull/6)