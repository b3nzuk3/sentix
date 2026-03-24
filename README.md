# Sentix - AI-Powered Product Operating System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Sentix is an AI-powered product operating system that ingests customer and stakeholder signals, synthesizes product problems, computes business impact deterministically, generates roadmap decisions, and outputs Jira-ready artifacts.

## Features

- **Multi-tenant SaaS** with hierarchical organizations (org → teams → projects)
- **AI-powered synthesis** using OpenRouter for theme extraction from signals
- **Deterministic engines** for revenue impact, churn risk, effort estimation, and priority decisions
- **Full traceability** from roadmap decisions back to source signals
- **Async architecture** with BullMQ for reliable, scalable job processing
- **Modern tech stack**: Next.js 15, Fastify, Prisma, PostgreSQL, Redis

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- pnpm 9+

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-org/sentix.git
cd sentix
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` in the root and configure:

```env
DATABASE_URL=postgresql://sentix:sentix@localhost:5432/sentix
REDIS_URL=redis://localhost:6379
API_SECRET_KEY=your-secret-key-change-this
OPENROUTER_API_KEY=your-openrouter-api-key
```

4. **Start Docker services** (PostgreSQL + Redis)

```bash
cd infra/docker
docker-compose up -d
```

5. **Initialize database**

```bash
pnpm db:push
```

6. **Seed demo data** (optional)

```bash
cd apps/api
pnpm db:seed
```

7. **Start development servers**

```bash
# Terminal 1: API server
pnpm --filter @sentix/api dev

# Terminal 2: Worker
pnpm --filter @sentix/worker dev

# Terminal 3: Web app
pnpm --filter @sentix/web dev
```

8. **Open the app**

Navigate to http://localhost:3000

## Project Structure

```
sentix/
├── apps/
│   ├── api/           # Fastify backend API
│   ├── web/           # Next.js frontend
│   └── worker/        # BullMQ worker service
├── packages/
│   ├── core/          # Deterministic engines (revenue, churn, effort, priority)
│   ├── prompts/       # AI prompt templates
│   ├── queue/         # BullMQ queue definitions
│   ├── types/         # Shared TypeScript types
│   └── ui/            # Shared UI components (@sentix/ui)
├── prisma/            # Database schema and seed
├── infra/             # Docker compose and deployment
└── docs/              # Specifications and documentation
```

## Architecture

### Backend (Fastify)

- **Auth**: JWT-based with refresh tokens
- **Projects**: CRUD with org/team scoping
- **Signals**: File upload (CSV, JSON, TXT) with parsing
- **Synthesis**: Async job queuing with `/synthesize` endpoint and polling
- **Analysis**: Retrieval with full theme details and traceability

### Worker (BullMQ)

- **synthesizeQueue**: Background job processor
- **OpenRouter client**: Theme extraction via LLM
- **Signal linker**: TF-IDF + cosine similarity for evidence matching
- **Engines**: Deterministic calculations for business metrics

### Frontend (Next.js 15)

- **App Router**: Modern Next.js architecture
- **Shadcn UI**: Accessible, customizable components
- **TanStack Query**: Server state management
- **Zustand**: Client state (auth)
- **React Hook Form**: Form handling with Zod validation

## API Reference

### Authentication

- `POST /auth/register` - Create new account
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token

### Projects

- `GET /projects` - List projects
- `GET /projects/:id` - Get project details
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Signals

- `POST /signals/upload` - Upload signal files or manual entry
- `GET /signals/:projectId` - List signals for project (pagination, filters)
- `GET /signals/:id` - Get single signal
- `DELETE /signals/:id` - Delete signal

### Synthesis

- `POST /synthesize` - Start synthesis job
- `GET /synthesize/:job_id` - Poll job status

### Analysis

- `GET /analysis/:projectId` - Get latest completed analysis
- `GET /analysis/history/:projectId` - All analyses
- `GET /analysis/:id` - Full analysis details
- `DELETE /analysis/:id` - Delete analysis
- `GET /trace/:analysisThemeId` - Traceability evidence

### Admin (ADMIN role only)

- `GET /admin/queues` - Queue statistics
- `POST /admin/queues/:queueName/retry-failed` - Retry failed jobs
- `GET /admin/health` - System health check
- `GET /admin/stats` - System statistics

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @sentix/api test
pnpm --filter @sentix/worker test
pnpm --filter @sentix/web test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Deployment

### Docker Compose (Production)

1. **Build images**

```bash
cd infra/docker
docker build -t sentix-api:latest -f Dockerfile.api ../apps/api
docker build -t sentix-worker:latest -f Dockerfile.worker ../apps/worker
docker build -t sentix-web:latest -f Dockerfile.web ../apps/web
```

2. **Run with docker-compose.prod.yml** (create from template)

3. **Environment**: Set production env vars in compose file or via `.env`

### Manual Deployment

Build and start each service individually:

```bash
# Build
pnpm build

# API
cd apps/api
npm start

# Worker
cd apps/worker
npm start

# Web (static export or Next.js server)
cd apps/web
npm start
```

## Deterministic Engines

The engines in `@sentix/core` are pure functions with 100% test coverage:

- **Revenue Engine**: Analyzes signals for monetary impact indicators
- **Churn Engine**: Detects churn risk signals
- **Effort Engine**: Estimates implementation effort based on scope and complexity
- **Priority Engine**: Combines revenue, churn, and effort into roadmap bucket decisions

## AI Integration

- Uses OpenRouter API for LLM access
- Theme extraction prompt considers project context, past decisions, and signals
- Evidence linking via TF-IDF + cosine similarity (threshold 0.15, max 20 signals)

## Configuration

### Retention Policies

Organizations can configure data retention days in settings. The system respects soft deletes and cleanup jobs.

### Performance

- Target: Synthesis completes in < 5min for 100 signals, < 10min for 500 signals
- Query optimization: Indexes on foreign keys and timestamps
- Caching: Redis for session and queue state

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
