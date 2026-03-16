# 🎾 TennisHQ

**Tennis data app — live scores, player profiles, H2H, rankings.**
Think FotMob, but for tennis.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + TypeScript, Fastify |
| **Database** | PostgreSQL + Drizzle ORM |
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS |
| **Package Manager** | pnpm (workspaces) |
| **Infrastructure** | Docker Compose |

## Project Structure

```
tennishq/
├── packages/
│   ├── api/          # Fastify backend API
│   │   ├── src/
│   │   │   ├── db/         # Drizzle schema & connection
│   │   │   ├── routes/     # API route handlers
│   │   │   ├── services/   # Business logic
│   │   │   ├── middleware/  # Auth, validation, etc.
│   │   │   ├── utils/      # Helpers, env config
│   │   │   └── types/      # Shared TypeScript types
│   │   └── Dockerfile
│   └── web/          # Next.js frontend
│       ├── app/            # App Router pages
│       ├── components/     # React components
│       ├── lib/            # Utilities
│       └── Dockerfile
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.json         # Base TS config
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose (for PostgreSQL)

### Setup

```bash
# Clone
git clone https://github.com/legendfz/tennis-data-app.git
cd tennis-data-app

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up postgres -d

# Copy env files
cp .env.example .env
cp packages/api/.env.example packages/api/.env

# Run backend
cd packages/api && pnpm dev

# Run frontend (in another terminal)
cd packages/web && pnpm dev
```

### Docker (full stack)

```bash
docker compose up --build
```

- **API:** http://localhost:3001
- **Web:** http://localhost:3000
- **PostgreSQL:** localhost:5432

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

*More endpoints coming as features are built.*

## Scripts

### Backend (`packages/api/`)
- `pnpm dev` — Start dev server with hot reload
- `pnpm build` — Compile TypeScript
- `pnpm test` — Run Jest tests
- `pnpm db:generate` — Generate Drizzle migrations
- `pnpm db:migrate` — Run migrations
- `pnpm db:push` — Push schema to DB

### Frontend (`packages/web/`)
- `pnpm dev` — Start Next.js dev server
- `pnpm build` — Build for production
- `pnpm start` — Start production server

## License

Private — TennisHQ
