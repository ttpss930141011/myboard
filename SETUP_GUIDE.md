# BoardWex Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL database (local or cloud)
- Clerk account for authentication

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Optional - Only if using Clerk JWT
CLERK_JWT_ISSUER_DOMAIN="https://[your-clerk-domain].clerk.accounts.dev"
```

### Getting Environment Variables

#### 1. PostgreSQL Database URL
You have several options:

**Option A - Use a cloud database (e.g., Zeabur, Supabase, Neon):**
```bash
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
```

**Option B - Local PostgreSQL:**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/boardwex"
```

**Option C - Cloud Providers (Free Tiers):**
- **Supabase**: https://supabase.com (500MB free)
- **Neon**: https://neon.tech (3GB free)
- **Aiven**: https://aiven.io (1 month free trial)

#### 2. Clerk Authentication Keys
1. Go to https://clerk.com and sign up/login
2. Create a new application
3. Choose "Next.js" as your framework
4. Copy the environment variables from the Clerk dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Installation Steps

### 1. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

### 2. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 3. Verify Environment Setup

Make sure your `.env.local` file has all required variables:

```bash
# Check if .env.local exists
ls -la .env.local

# Verify database connection
npx prisma db pull
```

## Running the Project

### Development Mode

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

### Production Build

```bash
# Build the project
npm run build

# Start production server
npm start
```

### Other Commands

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Format code (if prettier is configured)
npm run format

# View database in Prisma Studio
npx prisma studio
```

## Project Structure

```
board-wex/
├── app/                    # Next.js 14 app directory
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── board/[boardId]/   # Board canvas page
├── components/            # Shared components
├── hooks/                 # Custom React hooks
│   └── api/              # React Query hooks
├── lib/                   # Utilities and helpers
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── stores/               # Zustand stores
└── types/                # TypeScript types
```

## Features

- **Board Management**: Create, rename, delete, and favorite boards
- **Canvas Drawing**: 
  - Shapes (Rectangle, Ellipse)
  - Text and sticky notes
  - Freehand drawing
  - Layer management
- **State Management**: 
  - Local state with Zustand
  - Persistent storage in PostgreSQL
  - Undo/redo functionality
- **Authentication**: Organization-based access with Clerk

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` is correct
   - Check if the database server is running
   - Ensure your IP is whitelisted (for cloud databases)

2. **Clerk Authentication Error**
   - Verify your Clerk keys are correct
   - Check if you're using the right environment (development/production)
   - Ensure you've set up a Clerk application

3. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or manually
   lsof -ti:3000 | xargs kill -9
   ```

4. **Prisma Client Not Found**
   ```bash
   # Regenerate Prisma client
   npx prisma generate
   ```

5. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Environment Variable Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- [ ] `CLERK_SECRET_KEY` - From Clerk dashboard

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- **Railway**: Full-stack hosting with PostgreSQL
- **Render**: Free tier available
- **Fly.io**: Good for global distribution

## Security Notes

- Never commit `.env.local` to version control
- Keep your database credentials secure
- Regularly update dependencies
- Use environment variables for all sensitive data

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure database migrations are up to date
4. Check network connectivity to database

---

Last updated: 2024