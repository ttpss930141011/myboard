# MyBoard

Personal whiteboard and drawing tool. PostgreSQL backend, no SaaS dependencies.

## Quick Start

```bash
git clone https://github.com/ttpss930141011/myboard.git
cd myboard
pnpm install
cp .env.example .env  # Edit DATABASE_URL and AUTH_SECRET
pnpm exec prisma migrate dev
pnpm dev
```

Open http://localhost:3000

## Requirements

- Node.js 18+
- PostgreSQL database
- pnpm or npm

## Environment Setup

Create `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/myboard"
AUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email auth (recommended)
AUTH_RESEND_KEY="re_xxxxxxxxxxxx"  # Get from resend.com

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"
```

## Features

- Freehand drawing, shapes, text, sticky notes
- Canvas with zoom/pan, unlimited workspace
- Board management with favorites
- Auto-save to PostgreSQL
- Authentication via email magic links or OAuth
- Public board sharing

## Tech Stack

- Next.js 15 + TypeScript
- PostgreSQL + Prisma ORM
- Auth.js v5 (NextAuth)
- Zustand for state management
- Tailwind CSS + Shadcn/UI
- TanStack Query

## Development

```bash
# Database
pnpm exec prisma studio          # View database
pnpm exec prisma generate        # Generate client
pnpm exec prisma migrate dev     # Run migrations

# Code quality
pnpm run lint                    # ESLint
pnpm exec tsc --noEmit          # Type check

# Production
pnpm run build                   # Build
pnpm start                       # Production server
```

## Project Structure

```
app/                    # Next.js app router
├── (auth)/            # Auth pages
├── (dashboard)/       # Dashboard and boards
├── board/[boardId]/   # Canvas editor
└── api/               # API routes
components/            # UI components
hooks/                 # React hooks
lib/                   # Utilities
prisma/               # Database schema
stores/               # Zustand stores
```

## Security

OWASP Top 10 compliant with:
- CSRF protection and rate limiting
- Input sanitization and XSS prevention
- Secure headers and CSP
- Canvas data validation

See `docs/SECURITY.md` for details.

## Contributing

1. Fork the repo
2. Create feature branch
3. Make changes
4. Run tests: `pnpm test`
5. Submit PR

## License

MIT License - see LICENSE file.

---

Based on board-wex by [aftabrehan](https://github.com/aftabrehan/board-wex)