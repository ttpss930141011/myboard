# Personal Miro Documentation

Welcome to the documentation for Personal Miro - a single-user whiteboard application forked from BoardWex.

## Documentation Structure

### 📐 Architecture
- [Architecture Changes](./architecture/ARCHITECTURE_CHANGES.md) - Major refactoring from collaborative to personal whiteboard

### 🛠️ Development
- [Claude Code Guide](./development/CLAUDE.md) - AI assistance guide for development

### 🚀 Deployment
- Environment setup and deployment guides (coming soon)

## Quick Links

- [Main README](../README.md) - Project overview and setup
- [GitHub Repository](https://github.com/ttpss930141011/personal-miro)

## Key Features

- **Single-user focused**: No real-time collaboration overhead
- **Local-first**: All operations are instant with debounced persistence
- **Cost-effective**: No SaaS dependencies (removed Liveblocks/Convex)
- **Privacy-focused**: All data stays on your infrastructure
- **Performance**: Optimized for single-user experience

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **State Management**: Zustand with Immer
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (to be removed in Phase 2)
- **Styling**: Tailwind CSS, Shadcn/UI