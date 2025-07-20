# Personal Miro - Online Whiteboard & Drawing Tool

![Personal Miro - Online Whiteboard & Drawing Tool](https://github.com/ttpss930141011/personal-miro/assets/93012310/8d85080c-f3a7-412f-8194-b45b601a17e4)

A personal online whiteboard and drawing application built with Next.js 14, React, Prisma, PostgreSQL, TypeScript, and Tailwind CSS. Create, draw, and organize your ideas in a feature-rich digital canvas - no collaboration needed, just pure creativity!

## ✨ Features

### Drawing & Creation Tools
- 🎨 **Freehand Drawing** - Natural pencil tool with pressure sensitivity
- 🟦 **Shapes** - Rectangle, ellipse, and more geometric shapes
- 📝 **Text Tool** - Add and edit text with inline editing
- 🗒️ **Sticky Notes** - Quick notes with auto-sizing text
- 🎯 **Selection Tool** - Multi-select with selection net

### Canvas Management
- 🔄 **Undo/Redo** - Full history support (up to 50 actions)
- 🎪 **Layers** - Complete layering system with z-index management
- 🌈 **Color Picker** - Full color customization for all elements
- 🔍 **Zoom & Pan** - Navigate your canvas with mouse or trackpad
- 📐 **Grid Background** - Optional grid for precision placement

### Organization & Storage
- 💾 **Auto-save** - Changes persist automatically to PostgreSQL
- ⭐ **Favorites** - Mark important boards for quick access
- 🗂️ **Board Management** - Create, rename, and delete boards
- 🔐 **Authentication** - Secure personal workspace with Clerk
- 🏢 **Organizations** - Separate workspaces for different projects

### Performance & UX
- ⚡ **Optimized Rendering** - Smooth 60fps canvas operations
- 🎯 **Keyboard Shortcuts** - Efficient workflow with hotkeys
- 📱 **Responsive Design** - Works on desktop and tablet
- 🌙 **Modern UI** - Clean interface with Shadcn/UI components

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with Immer middleware
- **Authentication**: [Clerk](https://clerk.com/) with organizations
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- pnpm (recommended) or npm

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/ttpss930141011/personal-miro.git
cd personal-miro
```

### 2. Install dependencies

```bash
pnpm install
# or
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/personal_miro"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

### 4. Set up the database

```bash
# Generate Prisma client
pnpm exec prisma generate

# Run database migrations
pnpm exec prisma migrate dev

# (Optional) Seed the database with sample data
pnpm exec prisma db seed
```

### 5. Start the development server

```bash
pnpm run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for authentication | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key for backend | ✅ |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain | ✅ |

## 🎮 Usage

### Creating a Board
1. Click the "+" button or "New board" to create a new whiteboard
2. Give your board a meaningful title
3. Start drawing and creating!

### Drawing Tools
- **Pencil**: Freehand drawing with natural strokes
- **Rectangle/Ellipse**: Click and drag to create shapes
- **Text**: Click to place text, double-click to edit
- **Note**: Create sticky notes that auto-size text

### Canvas Navigation
- **Pan**: Hold middle mouse button or space + drag
- **Zoom**: Ctrl/Cmd + scroll or use zoom controls
- **Select**: Click elements or drag selection net

### Keyboard Shortcuts
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Delete`: Delete selected elements
- `Escape`: Cancel current operation
- `1-5`: Quick tool selection

## 🏗️ Project Structure

```
personal-miro/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application pages
│   ├── board/[boardId]/   # Board canvas page
│   └── api/               # API routes
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── stores/               # Zustand state stores
└── types/                # TypeScript type definitions
```

## 🔧 Development

### Database Commands

```bash
# View database in Prisma Studio
pnpm exec prisma studio

# Create a new migration
pnpm exec prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset
```

### Code Quality

```bash
# Run TypeScript type checking
pnpm exec tsc --noEmit

# Run ESLint
pnpm run lint

# Format code with Prettier
pnpm run format
```

### Building for Production

```bash
# Create production build
pnpm run build

# Start production server
pnpm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original inspiration from [Miro](https://miro.com/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Drawing algorithms from [Perfect Freehand](https://github.com/steveruizok/perfect-freehand)

---

Built with ❤️ by [ttpss930141011](https://github.com/ttpss930141011)