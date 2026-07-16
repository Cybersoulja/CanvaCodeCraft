# CLAUDE.md - AI Assistant Guide for CanvaCodeCraft

## Project Overview

CanvaCodeCraft is an **Ink Game Creator** - a visual game development tool for creating interactive fiction games using the Ink scripting language. It provides a drag-and-drop canvas interface combined with an Ink script editor, allowing users to create narrative-driven games with visual UI elements.

### Core Features
- Visual canvas for placing game elements (buttons, text, images)
- Monaco-based Ink script editor with syntax highlighting and validation
- Scene management system
- Game preview with live Ink story execution
- Export to multiple formats (JSON, Ink, HTML, ZIP)
- Persistent game storage via PostgreSQL

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for bundling and dev server
- **TailwindCSS** for styling
- **shadcn/ui** (Radix UI) for components
- **TanStack Query** for data fetching
- **react-dnd** for drag-and-drop functionality
- **Monaco Editor** for the code editor
- **inkjs** for Ink script compilation and execution
- **wouter** for client-side routing

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **Neon PostgreSQL** (serverless) for storage
- **Archiver** for ZIP file generation
- **Zod** for schema validation

## Directory Structure

```
CanvaCodeCraft/
├── client/                    # Frontend application
│   ├── index.html            # Entry HTML file
│   └── src/
│       ├── App.tsx           # Root component with routing
│       ├── main.tsx          # React entry point
│       ├── index.css         # Global styles
│       ├── components/
│       │   ├── canvas/       # Visual game canvas (drag-drop target)
│       │   ├── editor/       # Monaco-based Ink script editor
│       │   ├── export/       # Export dialog with multiple formats
│       │   ├── library/      # Component library (draggable elements)
│       │   ├── preview/      # Game preview with Ink execution
│       │   ├── properties/   # Element property editor
│       │   └── ui/           # shadcn/ui components
│       ├── hooks/            # Custom React hooks
│       ├── lib/
│       │   ├── ink-language.ts   # Monaco Ink language registration
│       │   ├── ink-utils.ts      # Ink script utilities
│       │   ├── queryClient.ts    # TanStack Query config
│       │   └── utils.ts          # General utilities (cn helper)
│       └── pages/
│           ├── workspace.tsx # Main workspace page
│           └── not-found.tsx # 404 page
├── server/                    # Backend application
│   ├── index.ts              # Express server entry point
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database storage layer
│   ├── db.ts                 # Database connection
│   └── vite.ts               # Vite dev server integration
├── shared/
│   └── schema.ts             # Shared types and Drizzle schema
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── drizzle.config.ts
```

## Key Concepts

### Game Elements
Defined in `shared/schema.ts`:
- **GameElement**: Visual element on canvas with `id`, `type`, `x`, `y`, `width`, `height`, `properties`
- **Element Types**: `button`, `text`, `image`
- **ElementProperties**: `text`, `fontSize`, `color`, `imageUrl`, `onClick`, `inkVariable`

### Scenes
Games consist of multiple scenes, each containing game elements. The canvas shows one scene at a time.

### Ink Integration
- Elements can bind to Ink variables via `inkVariable` property (for dynamic content)
- Buttons can trigger Ink functions via `onClick` property
- The preview component executes Ink stories using `inkjs`

## Development Commands

```bash
# Start development server (frontend + backend)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Run production build
npm start

# Push database schema changes
npm run db:push
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games` | List all games |
| GET | `/api/games/:id` | Get specific game |
| POST | `/api/games` | Create new game |
| PATCH | `/api/games/:id` | Update game |
| GET | `/api/elements` | Get game element library |
| POST | `/api/exports` | Create an export job (json/ink/html complete immediately, zip processes in the background) |
| GET | `/api/exports/:id` | Get export job status |
| GET | `/api/exports/:id/download` | Download a completed export's file |
| GET | `/api/games/:gameId/exports` | List export history for a game |

## Database Schema

```typescript
// Games table
games {
  id: serial (primary key)
  name: text
  scenes: jsonb (Scene[])
  inkScript: text
}

// Game elements library table
gameElements {
  id: serial (primary key)
  type: text ("button" | "text" | "image")
  properties: jsonb (ElementProperties)
}

// Export jobs table (export history + async zip processing)
exportJobs {
  id: serial (primary key)
  gameId: integer (nullable)
  format: text ("json" | "ink" | "html" | "zip")
  status: text ("pending" | "processing" | "completed" | "failed")
  fileName: text
  mimeType: text
  fileData: text (base64, set once completed)
  errorMessage: text (nullable)
  createdAt: timestamp
  completedAt: timestamp (nullable)
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | Yes |

## Code Conventions

### TypeScript
- Use strict mode (enabled in tsconfig)
- Prefer explicit types for function parameters
- Use Zod schemas for validation

### React Patterns
- Functional components with hooks
- TanStack Query for server state
- Local state with `useState` for UI state
- Custom hooks in `hooks/` directory

### Styling
- TailwindCSS utility classes
- `cn()` helper for conditional classes (`lib/utils.ts`)
- CSS variables for theming (defined in `index.css`)
- shadcn/ui components for consistent UI

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

## Key Files to Understand

1. **`client/src/pages/workspace.tsx`**: Main application state management, orchestrates all panels
2. **`client/src/components/canvas/index.tsx`**: Drag-drop target, scene rendering
3. **`client/src/components/preview/index.tsx`**: Ink story execution and game preview
4. **`client/src/components/export/index.tsx`**: Multi-format export functionality
5. **`client/src/lib/ink-utils.ts`**: Ink script parsing and boilerplate generation
6. **`shared/schema.ts`**: All TypeScript types and database schema
7. **`server/storage.ts`**: Database operations interface

## Common Tasks

### Adding a New Game Element Type
1. Update `ElementProperties` type in `shared/schema.ts`
2. Add rendering logic in `canvas/index.tsx`
3. Add property controls in `properties/index.tsx`
4. Update preview rendering in `preview/index.tsx`
5. Update HTML export generation in `export/index.tsx`

### Adding a New API Endpoint
1. Add route handler in `server/routes.ts`
2. Add storage method in `server/storage.ts` if needed
3. Create mutation/query hook in the client component

### Modifying Ink Integration
1. `lib/ink-utils.ts` - Ink script parsing utilities
2. `lib/ink-language.ts` - Monaco editor language support
3. `components/editor/index.tsx` - Editor configuration
4. `components/preview/index.tsx` - Ink story execution

## Testing Approach
This project does not have a test suite. When adding tests:
- Use Vitest (compatible with Vite)
- Place tests alongside source files or in `__tests__` directories
- Test Ink parsing utilities in isolation

## Security Considerations
- ZIP export validates filenames against allowlist
- HTML export escapes user content (`escapeHtml`, `escapeAttr` functions)
- API input validation using Zod schemas
- CORS and session handling via Express middleware

## Build & Deployment
- Development: `npm run dev` runs both Vite and Express on port 5000
- Production: `npm run build` creates `dist/` with bundled frontend and server
- The server serves static files in production mode
- Database migrations via Drizzle Kit (`npm run db:push`)

## Notes for AI Assistants
- Always run `npm run check` after TypeScript changes
- The project uses ES modules (`"type": "module"` in package.json)
- Monaco editor is configured with custom Ink language support
- The inkjs library expects compiled Ink JSON, but this project compiles raw Ink scripts on the fly in the browser
- Export HTML includes an inline copy of inkjs from CDN for standalone playback
