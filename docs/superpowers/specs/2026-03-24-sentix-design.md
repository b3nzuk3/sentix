# Sentix - Design Specification

**Date**: 2026-03-24
**Status**: Approved
**Version**: 1.0

---

## Executive Summary

Sentix is an AI-powered product operating system that ingests customer and stakeholder data, remembers product context over time, synthesizes product problems, computes business impact deterministically, generates roadmap decisions, and outputs Jira-ready artifacts.

The system must feel like "a senior product leader with memory, reasoning, and execution capability" — not a prototype or ChatGPT wrapper.

### Key Requirements

- **Multi-tenant SaaS** with hierarchical organizations (org → teams → projects)
- **Production-grade** reliability, observability, and testing
- **Deterministic engines** that compute business impact separate from AI synthesis
- **Full traceability** from roadmap decisions back to source signals
- **Async architecture** for AI-intensive processing
- **Modern tech stack**: Next.js, Fastify, Prisma, PostgreSQL, Redis, BullMQ

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌─────────────────────┐                     │
│                    │   Next.js Frontend  │                     │
│                    │   (apps/web)        │                     │
│                    └──────────┬──────────┘                     │
│                               │                                 │
│                    ┌──────────▼──────────┐                     │
│                    │   API Gateway       │                     │
│                    │   (Fastify)         │                     │
│                    └──────────┬──────────┘                     │
│                               │                                 │
│        ┌──────────────────────┼──────────────────────┐        │
│        │                      │                      │        │
│        ▼                      ▼                      ▼        │
│  ┌──────────┐          ┌──────────┐         ┌──────────┐   │
│  │   Sync   │          │   Async   │         │   Cache  │   │
│  │  Routes  │          │  Workers  │         │ (Redis)  │   │
│  └────┬─────┘          └────┬─────┘         └──────────┘   │
│        │                    │                              │
│        │            ┌───────▼────────┐                    │
│        │            │   BullMQ        │                    │
│        │            │   Queues        │                    │
│        │            └───────┬────────┘                      │
│        │                    │                                │
│        └────────────────────┼────────────────────────────────┘
│                             │                                 │
│                    ┌────────▼────────┐                      │
│                    │   PostgreSQL    │                      │
│                    │   (Prisma ORM)  │                      │
│                    └─────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Decisions

**Why async workers?**
- AI synthesis is long-running (30s - 2min). Sync endpoints would timeout.
- Retry logic: workers can automatically retry failed jobs with backoff.
- Reliability: queue persists jobs, workers can restart without data loss.
- Scalability: horizontal scaling by adding more workers.

**Why separate deterministic engines?**
- Transparency: business logic is inspectable and predictable.
- Testability: pure functions with 100% test coverage.
- Cost optimization: AI only does theme extraction; engines are free computation.

**Why configurable retention?**
- Compliance requirements vary by organization (GDPR, HIPAA, SOC2).
- Storage costs: high-volume customers may want shorter retention.
- Admin flexibility: CTOs can set policies per org.

---

## 2. Monorepo Structure

```
sentix/
├── apps/
│   ├── web/                    # Next.js 15 (App Router)
│   │   ├── src/
│   │   │   ├── app/           # Pages: /, /roadmap, /signals, /admin
│   │   │   ├── components/    # Shadcn UI + custom (RoadmapCard, TraceDrawer)
│   │   │   ├── lib/           # Utilities, API clients (React Query)
│   │   │   ├── stores/        # Zustand (ui state only)
│   │   │   └── styles/        # Tailwind + theme customization
│   │   ├── components.json    # Shadcn config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                    # Fastify 5
│   │   ├── src/
│   │   │   ├── routes/        # REST endpoints organized by domain
│   │   │   │   ├── auth.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── signals.ts
│   │   │   │   ├── synthesize.ts
│   │   │   │   ├── analysis.ts
│   │   │   │   └── admin.ts
│   │   │   ├── plugins/       # Fastify plugins
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── auth.ts     # JWT validation
│   │   │   │   ├── cors.ts
│   │   │   │   └── validation.ts # Zod pre-parsing
│   │   │   ├── schemas/        # Zod schemas for request/response
│   │   │   │   ├── auth.ts
│   │   │   │   ├── project.ts
│   │   │   │   ├── signal.ts
│   │   │   │   └── analysis.ts
│   │   │   ├── utils/          # Auth helpers, rate limiting
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   └── worker/                 # BullMQ worker service
│       ├── src/
│       │   ├── queues/        # Queue definitions & connection
│       │   │   ├── index.ts
│       │   │   └── types.ts
│       │   ├── jobs/          # Job processors
│       │   │   ├── synthesizeJob.ts
│       │   │   └── ingestJob.ts
│       │   ├── engines/       # Deterministic logic (pure functions)
│       │   │   ├── revenueEngine.ts
│       │   │   ├── churnEngine.ts
│       │   │   ├── effortEngine.ts
│       │   │   ├── priorityEngine.ts
│       │   │   └── index.ts
│       │   ├── clients/       # External service clients
│       │   │   └── openRouter.ts
│       │   ├── utils/         # Job helpers, logging
│       │   └── worker.ts      # Main worker entry point
│       └── package.json
│
├── packages/
│   ├── core/                   # Shared business logic (deterministic engines)
│   │   ├── src/
│   │   │   ├── engines/       # Re-exported from worker but usable standalone
│   │   │   ├── utils/
│   │   │   │   ├── signalLinker.ts  # Link signals to themes (cosine similarity?)
│   │   │   │   ├── moneyParser.ts
│   │   │   │   └── dateUtils.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── prompts/                # AI prompt templates
│   │   ├── src/
│   │   │   ├── themeExtraction.ts  # Main extraction prompt (OpenRouter)
│   │   │   ├── prompts.ts     # Registry of all prompts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                  # Shared TypeScript interfaces
│   │   ├── src/
│   │   │   ├── api.ts         # API request/response types
│   │   │   ├── database.ts    # Re-export Prisma types
│   │   │   ├── signal.ts
│   │   │   ├── analysis.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ui/                     # Shared UI components
│       ├── src/
│       │   └── components/
│       │       ├── RoadmapCard.tsx
│       │       ├── TraceDrawer.tsx
│       │       ├── SignalUpload.tsx
│       │       └── index.ts
│       └── package.json
│
├── infra/
│   └── docker/
│       ├── docker-compose.yml   # Postgres 15 + Redis 7
│       ├── Dockerfile.api
│       ├── Dockerfile.worker
│       ├── Dockerfile.web
│       └── .env.example
│
├── package.json                 # Root: pnpm workspaces, scripts, turborepo
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── .gitignore
└── README.md
```

### 2.1 Build & Dev Tooling

- **Package manager**: pnpm (strict mode, isolated node_modules)
- **Monorepo manager**: Turborepo with remote caching
- **TypeScript**: Strict mode, paths configured for internal packages
- **Linting**: ESLint + @typescript-eslint (shared config in packages/eslint-config)
- **Formatting**: Prettier (enforced on commit via husky)
- **Testing**:
  - Unit: Jest + ts-jest + Testing Library
  - API Integration: Supertest + Jest
  - E2E: Playwright
- **CLI**: Biome or Rimraf for clean builds

---

## 3. Database Schema (Prisma)

### 3.1 Schema Definition

See `prisma/schema.prisma`:

```prisma
model Organization {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  settings        Json?    // { retention_days: number, timezone: string, i18n: { locales: string[] } }
  created_at      DateTime @default(now())

  teams           Team[]
  projects        Project[]
  users           User[]
}

model Team {
  id              String   @id @default(cuid())
  name            String
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  projects        Project[]
  members         UserTeam[]
  created_at      DateTime @default(now())
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String?
  password_hash   String
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  teams           UserTeam[]
  role            UserRole @default(MEMBER)
  created_at      DateTime @default(now())
}

model UserTeam {
  user_id         String
  team_id         String
  role            TeamRole @default(MEMBER)
  joined_at       DateTime @default(now())

  user            User     @relation(fields: [user_id], references: [id])
  team            Team     @relation(fields: [team_id], references: [id])

  @@id([user_id, team_id])
}

model Project {
  id              String   @id @default(cuid())
  name            String
  description     String?
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  team_id         String?
  team            Team?     @relation(fields: [team_id], references: [id])
  signals         Signal[]
  themes          Theme[]   // Manually created themes
  analyses        Analysis[]
  decisions       Decision[]
  created_at      DateTime @default(now())
}

model Signal {
  id              String   @id @default(cuid())
  project_id      String
  project         Project  @relation(fields: [project_id], references: [id])
  source_type     SignalSource
  text            String   // Raw content (could be large TEXT)
  account_name    String?  // Customer identifier (for grouping)
  signal_type     SignalCategory?
  metadata        Json?    // Source-specific: { url?, jira_key?, slack_channel?, date? }
  created_at      DateTime @default(now())

  @@index([project_id, created_at])
  @@index([account_name])
}

model Theme {
  id              String   @id @default(cuid())
  project_id      String
  project         Project  @relation(fields: [project_id], references: [id])
  title           String   // Specific problem statement
  summary         String?  // Detailed explanation of the problem, who it affects, why it matters
  confidence      Float    // 0-1 from AI extraction (stored for reference)
  created_at      DateTime @default(now())

  @@index([project_id, confidence])
  // NOTE: Themes are NOT directly linked to Signals. Traceability is through AnalysisTheme.evidence_ids.
  // This decouples theme extraction from specific analyses - the same theme can be
  // identified in multiple synthesis runs, but each AnalysisTheme is a snapshot linking
  // a specific theme instance to a specific analysis with computed business impact.
}

model Analysis {
  id                  String   @id @default(cuid())
  project_id          String
  project             Project  @relation(fields: [project_id], references: [id])
  status              AnalysisStatus @default(PENDING) // PENDING, PROCESSING, COMPLETED, FAILED
  total_revenue_lost  Float?
  total_revenue_at_risk Float?
  error_message       String?  // If FAILED, store error for admin viewing
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  themes              AnalysisTheme[]
}

enum AnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model AnalysisTheme {
  id                  String   @id @default(cuid())
  analysis_id         String
  analysis            Analysis  @relation(fields: [analysis_id], references: [id])
  theme_id            String
  theme               Theme     @relation(fields: [theme_id], references: [id])
  title               String   // Inherited from Theme (snapshot at analysis time)
  roadmap_bucket      RoadmapBucket
  revenue_lost        Float?
  revenue_at_risk     Float?
  churn_probability  Float?   // 0-1
  effort_days         Int?
  effort_bucket       EffortBucket?
  confidence          Float    // Combined confidence (blend of AI confidence and engine certainty)
  evidence_ids        Json?    // [signal_id, ...] - signals that support this theme in this analysis
  engine_outputs      Json?    // Raw engine results: { revenue: {...}, churn: {...}, effort: {...}, priority: {...} }
  created_at          DateTime @default(now())
}

model Decision {
  id              String   @id @default(cuid())
  project_id      String
  project         Project  @relation(fields: [project_id], references: [id])
  title           String
  description     String?
  created_at      DateTime @default(now())
}

model Persona {
  id              String   @id @default(cuid())
  project_id      String
  project         Project  @relation(fields: [project_id], references: [id])
  name            String   // e.g., "Enterprise Admin", "End User"
  description     String   // Detailed persona description: demographics, goals, pain points, tech stack
  created_at      DateTime @default(now())

  @@index([project_id])
}

model ArchitectureComponent {
  id              String   @id @default(cuid())
  project_id      String
  project         Project  @relation(fields: [project_id], references: [id])
  name            String   // e.g., "Authentication Service", "Billing Microservice"
  description     String?  // Purpose, responsibilities, tech stack
  version         String?  // Optional version number
  status          ComponentStatus @default(STABLE) // PLANNING, IN_DEVELOPMENT, STABLE, DEPRECATED
  created_at      DateTime @default(now())

  @@index([project_id, status])
}

// Enums
enum UserRole {
  ADMIN
  MEMBER
  VIEWER
}

enum TeamRole {
  ADMIN
  MEMBER
  VIEWER
}

enum SignalSource {
  TRANSCRIPT
  SLACK
  HUBSPOT
  ZENDESK
  JIRA
  MANUAL
}

enum SignalCategory {
  COMPLAINT
  FEATURE_REQUEST
  BUG
  QUESTION
  PRAISE
}

enum RoadmapBucket {
  NOW
  NEXT
  LATER
}

enum EffortBucket {
  HIGH
  MEDIUM
  LOW
}

enum ComponentStatus {
  PLANNING
  IN_DEVELOPMENT
  STABLE
  DEPRECATED
}
```

### 3.2 Key Design Points

- **Multi-tenancy**: Organization is root entity. Users belong to orgs, can join multiple teams. Data isolation enforced by foreign keys and application logic.
- **Signal-Themes**: Many-to-many relationship via implicit join (signals linked to themes through AnalysisTheme.evidence_ids).
- **Analysis immutability**: Once created, Analysis records are never mutated. New synthesis creates new Analysis. This preserves historical snapshots.
- **Traceability**: evidence_ids in AnalysisTheme allows reconstruction of exact signals that contributed to a decision.
- **Retention policies**: Implemented via cron job that deletes Signals older than `org.settings.retention_days`, cascading to AnalysisTheme evidence. Themes and Analyses are retained longer (or indefinitely) for historical reporting.

---

## 4. Backend API (Fastify)

### 4.1 Authentication

**Strategy**: JWT with short-lived access tokens (15min) + long-lived refresh tokens (30d). Refresh tokens stored in Redis with organization_id and user_id.

- `POST /auth/register` → creates org + first admin user + returns tokens
- `POST /auth/login` → validates password, issues tokens
- `POST /auth/refresh` → validates refresh token, issues new access token, rotates refresh token
- Fastify `auth` plugin validates access token on protected routes, populates `request.user`

### 4.2 Endpoint Specification

All endpoints return JSON with consistent error format:

```json
{
  "error": "ValidationError",
  "message": "Invalid request body",
  "details": { "field": "reason" }
}
```

#### Auth
- `POST /auth/register` - `{ email, password, org_name, user_name }` → `{ user, org, tokens }`
- `POST /auth/login` - `{ email, password }` → `{ user, org, tokens }`
- `POST /auth/refresh` - `{ refresh_token }` → `{ tokens }`
- `POST /auth/logout` - `{}` → `{}` (blacklist refresh token)

#### Organizations
- `GET /orgs/:orgId/teams` - List teams (org admins only)
- `POST /orgs/:orgId/teams` - `{ name }` → Team
- `POST /orgs/:orgId/invite` - `{ email, team_id?, role }` → invitation (email sent in future)

#### Projects
- `POST /projects` - `{ name, description?, team_id? }` → Project
- `GET /projects` - List projects user has access to (via org/team membership)
- `GET /projects/:id` → Project with counts (signals, analyses, last_analysis_date)
- `PATCH /projects/:id` - `{ name?, description? }` → Project
- `DELETE /projects/:id` → 204

#### Signals
- `POST /signals/upload` - Multi-part form:
  - `files`: multiple files (CSV, JSON, TXT)
  - `project_id`: string
  - `source_type`: one of the SignalSource enums
  - Parser detects format, extracts records, bulk creates Signal records
  - Returns `{ count: number, signals: Signal[] }` (first 10 for preview)
- `GET /signals/:projectId` - Query params: `page`, `limit`, `source_type`, `account_name`, `from`, `to`
- `GET /signals/:id` → Signal
- `DELETE /signals/:id` → 204 (only if no AnalysisTheme.evidence_ids contains it)

#### Themes (Manual Curation)
- `GET /themes/:projectId` → Theme[]
- `POST /themes` - `{ project_id, title, summary? }` → Theme
- `PATCH /themes/:id` - `{ title?, summary? }` → Theme
- `DELETE /themes/:id` → 204 (cascade detach from AnalysisTheme if already used)

#### Synthesis (Async)
- `POST /synthesize` - `{ project_id, options?: { signal_limit? } }`
  - Creates Analysis record (status: "pending")
  - Enqueues job to `synthesizeQueue` with `analysis_id`
  - Returns `{ job_id, analysis_id, status: "queued" }`
- `GET /synthesize/:job_id` - Polling endpoint
  - Returns `{ status: "pending"|"processing"|"completed"|"failed", progress?: { current, total }, result?: { analysis_id } }`
  - On completed, includes `analysis_id` for redirect

#### Analysis
- `GET /analysis/:projectId` - Latest completed Analysis with themes (JOINed)
- `GET /analysis/history/:projectId` - All analyses (id, created_at, totals)
- `GET /analysis/:id` - Full analysis with AnalysisTheme + linked Theme details
- `DELETE /analysis/:id` → 204 (soft-cascade: remove AnalysisTheme records)

#### Traceability
- `GET /trace/:analysisThemeId` - Detailed evidence for a roadmap item
  - Returns: `{ analysis_theme: { title, roadmap_bucket, revenue_lost, revenue_at_risk, churn_probability, effort_days, effort_bucket, confidence, engine_outputs }, theme: { title, summary }, signals: Signal[] }`
  - Engine outputs (from AnalysisTheme.engine_outputs) show raw calculations for transparency.

#### Admin
- `GET /admin/queues` - Queue stats for all queues (requires Admin role)
  - `{ queues: [{ name, pending, active, completed, failed, delayed }] }`
- `POST /admin/queues/:queueName/retry-failed` - Retry all failed jobs in named queue
- `GET /admin/health` - `{ postgres: "ok", redis: "ok", workers: "ok" }`
- `POST /admin/cleanup` - Trigger retention cleanup manually (cron also runs daily)

### 4.3 Validation

All input validated with Zod schemas in `packages/schemas`. Fastify plugin pre-parses body/query/params and rejects invalid requests before hitting business logic.

### 4.4 Error Handling

- **4xx**: Client errors (validation, not found, permission denied)
- **5xx**: Server errors (DB failure, AI timeout, unexpected exception)
- All errors logged with structured JSON for observability
- On 5xx, return generic message to user, log details for debugging

### 4.5 Rate Limiting

To protect against abuse and control costs:

**Per-User/IP Rate Limit**:
- `/signals/upload`: 100 requests per hour
- `/synthesize`: 10 requests per hour (expensive AI call)
- General API: 1000 requests per hour

**Implementation**:
- Use `@fastify/rate-limit` plugin with Redis store (shared across workers).
- Keyed by `user_id` if authenticated, else `IP`.
- On limit exceeded, return `429 Too Many Requests` with `Retry-After: 3600` header.

**Monitoring**:
- Metric `sentix_rate_limit_total` counter for diagnostics.
- Admin dashboard shows rate limit usage per org.

### 4.6 File Upload Security

The `/signals/upload` endpoint accepts multi-part file uploads:

**Security Measures**:
- **File size limit**: Configure Fastify `multer` with `limits: { fileSize: 10 * 1024 * 1024 }` (10MB max).
- **Allowed MIME types**: Only `text/csv`, `application/json`, `text/plain`.
- **Filename sanitization**: Generate random UUID for stored filename; ignore original name.
- **Content validation**: After parsing, check record count doesn't exceed 10,000 per upload (DoS protection).
- **Virus scanning**: (Optional v2 - out of scope for MVP; can add ClamAV container later).
- **Parse errors**: Return 400 with details: `{ error: "ParseError", details: { line: 42, reason: "Invalid CSV column" } }`.

---

## 5. Worker System (BullMQ)

### 5.1 Queue Configuration

```typescript
// queues/index.ts
export const synthesizeQueue = new Queue<SynthesizeJobData>('synthesize', {
  connection: { host: REDIS_HOST, port: REDIS_PORT },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,    // Keep last 100 completed
      age: 24 * 60 * 60 * 1000, // Keep for 24h
    },
    removeOnFail: {
      count: 50,
      age: 7 * 24 * 60 * 60 * 1000,
    },
  },
});
```

### 5.2 Job Processor: `synthesizeJob.ts`

```typescript
export async function processSynthesizeJob(job: Job<SynthesizeJobData>) {
  const { analysis_id, project_id, user_id } = job.data;
  const logger = createJobLogger(job);

  try {
    logger.info('Starting synthesis', { analysis_id });

    // 1. Update Analysis status to PROCESSING
    await prisma.analysis.update({
      where: { id: analysis_id },
      data: { status: 'PROCESSING' }
    });

    // 2. Fetch project context with personas and architecture
    const project = await prisma.project.findUnique({
      where: { id: project_id },
      include: {
        signals: { orderBy: { created_at: 'desc' }, take: 500 },
        themes: true,
        decisions: { orderBy: { created_at: 'desc' }, take: 20 },
        personas: true,
        architectureComponents: { where: { status: { in: ['STABLE', 'IN_DEVELOPMENT'] } } }
      }
    });

    if (!project) throw new Error('Project not found');

    // 3. Prepare AI prompt context
    const context = {
      project: { name: project.name, description: project.description },
      signals: project.signals.map(s => ({
        id: s.id,
        text: s.text,
        source: s.source_type,
        account: s.account_name
      })),
      existing_themes: project.themes.map(t => ({ title: t.title, summary: t.summary })),
      past_decisions: project.decisions.map(d => ({ title: d.title, description: d.description })),
      personas: project.personas,
      architectureComponents: project.architectureComponents
    };

    // 4. Call OpenRouter AI
    logger.debug('Calling OpenRouter', { signal_count: project.signals.length });
    const extractedThemes = await openRouterClient.extractThemes(context); // Returns [{ title, affected_users, reason, evidence, confidence }]

    // 5. Run deterministic engines & create AnalysisTheme records
    logger.info('Running engines', { theme_count: extractedThemes.length });

    // Fetch existing themes for deduplication
    const existingThemes = await prisma.theme.findMany({
      where: { project_id },
      orderBy: { created_at: 'desc' },
      take: 100
    });

    const analysisThemesData: AnalysisThemeCreateInput[] = [];

    for (const extractedTheme of extractedThemes) {
      // Find or create Theme (deduplication by title similarity)
      const matchingExisting = findSimilarTheme(extractedTheme.title, existingThemes, 0.85);
      let themeId: string;
      const themeTitleSnapshot = extractedTheme.title; // Snapshot at analysis time

      if (matchingExisting) {
        themeId = matchingExisting.id;
        // If existing theme exists, we still snapshot its current title (should match extractedTheme)
      } else {
        const newTheme = await prisma.theme.create({
          data: {
            project_id,
            title: extractedTheme.title,
            summary: extractedTheme.reason,
            confidence: extractedTheme.confidence
          }
        });
        themeId = newTheme.id;
      }

      // Link supporting signals from AI evidence or similarity search
      const supportingSignals = await signalLinker.linkSignals(extractedTheme, project.signals);

      // Run all engines in parallel
      const [revenue, churn, effort] = await Promise.all([
        revenueEngine.analyze(supportingSignals),
        churnEngine.analyze(supportingSignals),
        effortEngine.estimate(extractedTheme, supportingSignals)
      ]);

      const priority = priorityEngine.decide({
        revenue_lost: revenue.total_lost,
        revenue_at_risk: revenue.at_risk,
        churn_probability: churn.risk,
        effort_bucket: effort.bucket
      });

      analysisThemesData.push({
        title: themeTitleSnapshot, // Snapshot for historical record
        theme: { connect: { id: themeId } },
        roadmap_bucket: priority.bucket,
        revenue_lost: revenue.total_lost,
        revenue_at_risk: revenue.at_risk,
        churn_probability: churn.risk,
        effort_days: effort.estimate,
        effort_bucket: effort.bucket,
        confidence: priority.confidence,
        evidence_ids: supportingSignals.map(s => s.id),
        engine_outputs: {
          revenue: { total_lost: revenue.total_lost, at_risk: revenue.at_risk },
          churn: { risk: churn.risk },
          effort: { bucket: effort.bucket, estimate: effort.estimate },
          priority: { bucket: priority.bucket, confidence: priority.confidence }
        }
      });
    }

    // 6. Update existing Analysis with computed totals and themes
    const total_revenue_lost = analysisThemesData.reduce((sum, t) => sum + (t.revenue_lost || 0), 0);
    const total_revenue_at_risk = analysisThemesData.reduce((sum, t) => sum + (t.revenue_at_risk || 0), 0);

    await prisma.analysis.update({
      where: { id: analysis_id },
      data: {
        status: 'COMPLETED',
        total_revenue_lost,
        total_revenue_at_risk,
        themes: { create: analysisThemesData }
      }
    });

    logger.info('Synthesis complete', { analysis_id, theme_count: analysisThemesData.length });
    return { analysis_id, theme_count: analysisThemesData.length };

  } catch (error) {
    logger.error('Synthesis failed', { error: error instanceof Error ? error.message : error, analysis_id });

    // Attempt to mark Analysis as FAILED
    try {
      await prisma.analysis.update({
        where: { id: analysis_id },
        data: {
          status: 'FAILED',
          error_message: error instanceof Error ? error.message : String(error)
        }
      });
    } catch (updateError) {
      logger.error('Failed to update analysis status', { error: updateError });
    }

    throw error; // BullMQ will retry per job options
  }
}
```

### 5.3 Deterministic Engines

All engines in `packages/core/engines/` as pure, deterministic functions with 100% test coverage.

#### Revenue Engine
- Parses signal text for monetary values and deal status keywords
- Keywords: "lost", "cancelled", "downgraded", "churned", "budget cut"
- Currency regex: `/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g`
- Returns: `{ total_lost: number, at_risk: number }`
- Conservative: if no explicit revenue figure, estimate based on plan tier? (Fallback: null, AI confidence lower)

#### Churn Engine
- Scans for complaint frequency and severity markers
- Severity weight multipliers: "critical" (3x), "urgent" (2x), "blocking" (2x), "major" (1.5x)
- Output: `{ risk: float (0-1) }` normalized to 0-1 scale
- Formula: `min(1.0, (complaint_count * avg_severity) / threshold)`

#### Effort Engine
- Keyword categorization:
  - HIGH: "auth", "security", "sso", "saml", "ldap", "compliance", "gdpr", "migration", "database", "infrastructure"
  - MEDIUM: "bug", "performance", "latency", "search", "reporting", "export", "api"
  - LOW: "ui", "ux", "design", "styling", "copy", "color", "font", "responsive"
- Story point estimates: HIGH (13-21 sp = 5-8 days), MEDIUM (5-8 sp = 2-4 days), LOW (1-3 sp = 0.5-2 days)
- Output: `{ bucket: EffortBucket, estimate: number (days) }`

#### Priority Engine
- Decision matrix:
  - IF `effort === LOW` AND `revenue_lost > 0` → NOW (0.9)
  - IF `revenue_lost ≥ 10000` OR `churn_probability ≥ 0.7` → NOW (0.8)
  - IF `revenue_at_risk ≥ 5000` → NEXT (0.7)
  - IF `effort === LOW` → LATER (0.6)
  - DEFAULT → LATER (0.5)
- Confidence combines revenue certainty (0.5 if estimated), churn certainty (0.5 if mild), effort certainty (0.9 if clear keyword match)

### 5.4 AI Integration (OpenRouter)

**Client**: `packages/worker/clients/openRouter.ts`

```typescript
export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = 'stepfun/step-3.5-flash:free';

  async extractThemes(context: SynthesisContext): Promise<Theme[]> {
    const prompt = themeExtractionPrompt.build(context);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sentix.io', // Optional for OpenRouter ranking
        'X-Title': 'Sentix' // Optional
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Low for deterministic extraction
        response_format: { type: 'json_object' } // Force JSON mode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter error: ${error.message}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return parseThemes(content); // Parse and validate against Theme[] shape
  }
}
```

**Prompt Template** (`packages/prompts/src/themeExtraction.ts`):

```typescript
export const themeExtractionPrompt = `
You are a senior product analyst for a SaaS company. Your job: read customer signals (transcripts, support tickets, slack messages) and extract SPECIFIC product problems that require action.

## Project Context

Project: {{project_name}}
Description: {{project_description}}

{% if personas %}
## User Personas
{% for persona in personas %}
- {{ persona.name }}: {{ persona.description }}
{% endfor %}
{% endif %}

{% if architecture_summary %}
## Architecture Components
{% for comp in architecture_summary %}
- {{ comp.name }} ({{ comp.status }}): {{ comp.description }}
{% endfor %}
{% endif %}

{% if past_decisions %}
## Past Decisions
{% for decision in past_decisions %}
- {{ decision.title }}: {{ decision.description }}
{% endfor %}
{% endif %}

## Signals

{% for signal in signals %}
[{{ loop.index0 }}] ID: {{ signal.id }}
Source: {{ signal.source }}
Account: {{ signal.account_name or 'N/A' }}
Content: {{ signal.text }}

{% endfor %}

## Instructions

1. Read all signals carefully.
2. Identify specific product problems (NOT generic categories).
3. Each problem must be:
   - **Actionable**: Can be turned into a specific ticket or project
   - **Specific**: Includes WHO is affected and WHY it matters
   - **Evidence-based**: Referenced by signal ID(s)

## BAD OUTPUT (DO NOT DO)

- "Authentication issues"
- "Performance problems"
- "Feature requests"
- "UI/UX improvements"

## GOOD OUTPUT (DO THIS)

- "Missing SAML/SSO is blocking enterprise deals and delaying procurement (ref: signals 0, 3)" because customers cannot integrate with their identity providers.
- "CSV uploads fail for files >50MB, breaking weekly data import workflow for power users (ref: signal 7)" due to memory limits in the parser.
- "PM team output is too generic and not actionable (ref: signals 12, 15)" because the AI prompt lacks specificity constraints.

## Output Format

Respond with ONLY a JSON object:

{
  "themes": [
    {
      "title": "Specific product problem statement",
      "affected_users": "Who is affected (e.g., 'Enterprise admins', 'End users on free tier')",
      "reason": "Why this is a problem, including business impact if clear from signals",
      "evidence": ["signal_id_1", "signal_id_2", ...],  // IDs from above
      "confidence": 0.85  // 0-1 float, how certain are you this is a real problem? Consider signal clarity and agreement.
    }
  ]
}

Rules:
- Maximum 8 themes. If there are 20+ distinct problems, group by similarity.
- If a signal is noise (e.g., "great product!"), ignore it.
- Do NOT invent signal IDs - ONLY reference IDs that exist in the input.
- Title should be concise (5-10 words) but specific.
`;
```

**Key prompt engineering decisions**:
- **Few-shot examples** provided in instructions (BAD vs GOOD) to steer output.
- **Persona and architecture** in context to help AI attribute correctly.
- **Evidence requirement** forces AI to cite sources, enabling traceability.
- **Confidence float** allows engines to weight uncertain themes lower.
- **Max 8 themes** prevents overwhelming the roadmap; large signal sets should be prioritized by AI.
- **JSON format** with `response_format: {"type": "json_object"}` ensures parseable output.

### 5.5 Signal-Thematic Linking

After AI extracts themes, we need to associate them with the source signals for traceability.

**Strategy**:
1. AI provides `evidence` list (signal IDs it references). Use those directly.
2. For themes without explicit evidence, perform semantic similarity search:
   - Vector embeddings would be ideal but expensive.
   - Fallback: keyword overlap + TF-IDF similarity between theme title/description and signal text.
   - Implement in `signalLinker.ts` as simple text matching for MVP.
   - Future: upgrade to embeddings (OpenAI text-embedding-ada-002 or similar).

### 5.6 Synthesis Context Assembly

The `processSynthesizeJob` function retrieves project context before calling AI:

```typescript
const project = await prisma.project.findUnique({
  where: { id: project_id },
  include: {
    signals: { orderBy: { created_at: 'desc' }, take: 500 },
    themes: true,                      // Existing manually/thematically created themes
    decisions: { orderBy: { created_at: 'desc' }, take: 20 },
    // NEW: Include personas and architecture components
    personas: true,
    architectureComponents: { where: { status: { in: ['STABLE', 'IN_DEVELOPMENT'] } } }
  }
});
```

**Why include personas?**
The AI prompt should be aware of who the users are to correctly identify "affected_users" in themes. For example, if the project has an "Enterprise Admin" persona, a theme about SAML can be correctly attributed.

**Why include architecture components?**
Understanding the current architecture helps the AI avoid suggesting themes that contradict known technical constraints (e.g., suggesting "real-time sync" if architecture is batch-oriented). Also, architecture status (IN_DEVELOPMENT) may indicate areas of recent change that generate customer feedback.

**Theme Deduplication Strategy**:

When AI returns its list of extracted themes, we check for similarity with existing project themes:

```typescript
const existingThemes = await prisma.theme.findMany({
  where: { project_id },
  orderBy: { created_at: 'desc' },
  take: 100
});

for (const extractedTheme of themes) {
  const matchingExisting = findSimilarTheme(extractedTheme.title, existingThemes, 0.85);
  if (matchingExisting) {
    // Use existing theme instead of creating duplicate
    themeId = matchingExisting.id;
  } else {
    // Create new theme
    const newTheme = await prisma.theme.create({ data: { project_id, title, summary, confidence } });
    themeId = newTheme.id;
  }
  // Then create AnalysisTheme linking to themeId
}
```

This prevents proliferation of near-duplicate themes across multiple synthesis runs.

**Similarity Algorithm** (MVP, simple):
```typescript
function findSimilarTheme(newTitle: string, existingThemes: Theme[], threshold: number = 0.85): Theme | null {
  const newWords = new Set(newTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (newWords.size === 0) return null;

  let bestMatch: Theme | null = null;
  let bestScore = 0;

  for (const theme of existingThemes) {
    const existingWords = new Set(theme.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const intersection = new Set([...newWords].filter(x => existingWords.has(x)));
    const union = new Set([...newWords, ...existingWords]);
    const jaccard = intersection.size / union.size;
    if (jaccard >= threshold && jaccard > bestScore) {
      bestScore = jaccard;
      bestMatch = theme;
    }
  }
  return bestMatch;
}
```

Uses Jaccard similarity (word overlap) as a cheap approximation. With threshold 0.85, only very similar titles match. Future: upgrade to embedding-based cosine similarity.

### 5.7 Error Handling & Job Resilience

**AI Failures**:
- OpenRouter returns 429 (rate limit) or 5xx (upstream error): worker catches, waits for backoff, retries (up to 3 attempts configured in BullMQ).
- If all retries exhausted: job fails, Analysis.status set to "failed", error logged with full context.
- User experience: polling endpoint returns `status: "failed"` with `error: { message, retryable? }`. UI shows "Synthesis failed. Retry" button.

**Partial Success**:
- If some themes cause errors (e.g., parsing failure), the job should still succeed for the ones that parsed correctly.
- Implementation: wrap each theme analysis in try/catch, log failures, continue. Return successful themes count.
- If NO themes succeed, mark entire job as failed.

**Job Timeouts**:
- BullMQ timeout set to 10 minutes (600000ms). If job exceeds: fails, requeued if attempts remain.
- Worker should also implement internal timeout per theme (e.g., 30s) to prevent one problematic signal from blocking all.

**Persistent Failures**:
- Admin can view failed jobs (`/admin/queues`) and retry manually.
- Failed job details include error stack (if not user-facing) for debugging.

### 5.8 Concurrency Control

To avoid race conditions where multiple synthesis jobs run simultaneously for the same project:

**Strategy**: Use custom check:

```typescript
// At start of processSynthesizeJob:
const activeJobs = await synthesizeQueue.getActive();
const pendingJobs = await synthesizeQueue.getWaiting();
const hasActiveOrPending = activeJobs.some(job => job.data.project_id === project_id)
                        || pendingJobs.some(job => job.data.project_id === project_id);

if (hasActiveOrPending) {
  throw new Error('Synthesis already in progress for this project');
}
```

Alternative: use BullMQ's `groupKey` and `groupLimit` if supported.

API endpoint should return `409 Conflict` if user tries to synthesize while another is pending/active.

---

## 6. Frontend (Next.js + Shadcn UI)

### 6.1 Tech Stack Details

- **Next.js 15**: App Router, Server Components by default, Client Components for interactivity
- **React 19**: latest features (actions, use, etc.)
- **Tailwind CSS 3.4**: utility-first styling
- **Shadcn UI**: Radix primitives + custom styling
- **TanStack Query v5**: server state management (caching, background refetch, optimistic updates)
- **Zustand**: client-side UI state (modals, drawers, form drafts)
- **React Hook Form + Zod**: form handling with schema validation
- **axios**: API client with interceptors for auth tokens

### 6.2 Design System

**Theme** (Tailwind config):
```javascript
colors: {
  background: '#0B0F1A', // Deep space blue
  foreground: '#F8FAFC', // White-ish
  primary: '#3B82F6',     // Blue
  primaryForeground: '#FFFFFF',
  accent: '#06B6D4',      // Cyan glow
  accentForeground: '#0B0F1A',
  muted: '#1E293B',
  mutedForeground: '#94A3B8',
  card: '#1E293B',
  cardForeground: '#F8FAFC',
  border: '#334155',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B'
}
```

**Effects**:
- Glow borders on focus/hover: `box-shadow: 0 0 15px rgba(59, 130, 246, 0.5)`
- Smooth transitions: 200ms ease-out
- Card ray tracing (optional v2): radial gradient backgrounds

### 6.3 Page Structure

#### Layout
```
app/
├── layout.tsx          # Auth guards, Org/Project switcher in header
├── page.tsx           # Dashboard (/)
├── roadmap/
│   └── page.tsx      # Roadmap view (3 columns)
├── signals/
│   └── page.tsx      # Signals table
├── admin/
│   └── page.tsx      # Admin dashboard (org admins only)
└── (auth)/
    ├── login/
    └── register/
```

#### 1. Dashboard (`/`)

**Components**:
- `ProjectSelector`: dropdown of user's projects (from React Query)
- `IngestPanel` (sidebar):
  - Tabs: "Text", "Files"
  - Text tab: `Textarea` for paste, `SignalSource` selector, "Add Signal" button
  - Files tab: File dropzone with accepted types (`.csv,.json,.txt`), source type selector, "Upload" button
  - Preview table: shows first N uploaded signals with edit/delete
- `SynthesizeButton`: primary action, shows job status while processing
- `RecentAnalyses`: small table of last 5 analyses with dates and theme counts

**Flow**:
1. User uploads signals → UI optimistically adds to table, POST /signals/upload
2. User clicks "Synthesize" → POST /synthesize, get job_id
3. Polling every 3s: GET /synthesize/:job_id
4. On complete: redirect to `/roadmap` or show "View Roadmap" button
5. On failed: show error message with retry button; optionally display error details in a disclosure.

#### 2. Roadmap View (`/roadmap`)

**Layout**: 3-column grid (Now, Next, Later)

**Components**:
- `RoadmapColumn`: accepts bucket = "NOW"|"NEXT"|"LATER", renders list of `RoadmapCard`s
- `RoadmapCard`:
  - Title (thematic problem)
  - Badge: effort bucket (color-coded: red/yellow/green)
  - Revenue: `$${formatCurrency(revenue_lost)}` or "Not enough data" if null/0
  - Effort: `${effort_days} days`
  - Confidence: progress bar (0-100%)
  - Trace button: opens `TraceDrawer` for this AnalysisTheme
- `TraceDrawer` (slide-over, right side):
  - Title: analysis theme title
  - Sections:
    1. Overview: roadmap bucket, revenue, effort, confidence
    2. Evidence: list of signals (collapsible full text)
    3. Reasoning: show AI theme.reason + engine outputs (JSON, expandable)
    4. Manual Override (future): fields to adjust revenue/effort/priority

**State**:
- React Query: `useAnalysis(projectId)` → latest analysis with themes
- Local state: which drawer is open (or null)

#### 3. Signals List (`/signals`)

**Table columns**: ID (truncated), Source, Account, Text Preview (max 100 chars), Created At, Actions (Delete)
**Filters**:
- Date range picker
- Source type multiselect dropdown
- Account name search
- Clear filters button

**Bulk actions**: Select rows → Delete or Export CSV

#### 4. Admin Dashboard (`/admin`)

**Tabs**:
- **Queues**: Table with queue name, pending/active/completed/failed counts. Button: "Retry Failed" (POST /admin/queues/:name/retry-failed)
- **Health**: Cards with status (DB, Redis, Workers). Details: DB connection pool size, Redis memory usage, worker process uptime.
- **Retention**: Slider to set default retention days (per org). "Run Cleanup Now" button.

---

## 7. Testing Strategy

### 7.1 Unit Tests (Jest)

**Coverage target**: 90%+ overall, 100% for engines

**Test files**:
- `packages/core/engines/__tests__/revenueEngine.test.ts`
- `packages/core/engines/__tests__/churnEngine.test.ts`
- `packages/core/engines/__tests__/effortEngine.test.ts`
- `packages/core/engines/__tests__/priorityEngine.test.ts`
- `apps/api/src/routes/__tests__/synthesize.test.ts` (mock worker)
- `apps/worker/src/queues/__tests__/synthesizeJob.test.ts` (integration test with BullMQ mocks)

### 7.2 API Integration Tests (Supertest)

**Setup**: Spin up Fastify with test plugins, use SQLite in-memory or test Postgres container.

**Test cases**:
- `/auth/register` → 201, user created, org created
- `/auth/login` → 200 with tokens, invalid creds → 401
- `/projects` → CRUD with auth checks
- `/signals/upload` → file parsing, validation errors
- `/synthesize` → 202, job created, polling returns statuses
- Permission denied: user from org A cannot access org B's projects

### 7.3 E2E Tests (Playwright)

**Scenarios**:
1. "Happy path": Register → Create project → Upload 3 signal files → Synthesize → View roadmap → Trace a theme
2. "Failed synthesis": Simulate AI timeout (mock), system retries, user sees error after max attempts
3. "Permission boundary": User in team X cannot access project in team Y
4. "Admin queue monitoring": Admin views queue, retries failed jobs

**Test environment**: Docker Compose stack spun up via Playwright fixture, torn down after tests.

### 7.4 CI/CD Pipeline

**.github/workflows/ci.yml**:
- `pnpm install` (with frozen lockfile)
- `turbo run lint`
- `turbo run test` (unit + integration)
- `turbo run build` (typecheck all packages)
- On push to main: also `turbo run e2e`

---

## 8. Observability & Monitoring

### 8.1 Structured Logging (Pino)

- All services (api, worker) use pino with JSON output
- Log levels: `trace` (debug), `info`, `warn`, `error`
- Context: `{ service, job_id, user_id, project_id, request_id, timestamp }`
- Transport: file (local dev) → stdout (Docker) → Loki/Datadog (production)

### 8.2 Metrics (Prometheus format)

Exposed at `/metrics` in api and worker:

- `sentix_jobs_total{queue, status}` - counter (completed, failed)
- `sentix_job_duration_seconds{queue}` - histogram
- `sentix_api_request_duration_seconds{method, route, status}` - histogram
- `sentix_database_query_duration_seconds{query}` - histogram
- `sentix_openrouter_requests_total{status}` - counter
- `sentix_openrouter_tokens_total{direction}` - counter (input, output)

Grafana dashboards planned for Phase 2.

### 8.3 Health Checks

- `GET /health` - Checks DB connectivity (SELECT 1) and Redis PING. Returns 200 if both ok.
- `GET /ready` - Checks that worker process is listening (api only). Returns 200 if ready to serve traffic.
- Worker: internal liveness probe via BullMQ `getHello()`.

### 8.4 Admin UI Monitoring

- Real-time queue stats refresh every 10s
- Failed jobs list with error message, retry button per job or bulk
- Recent logs: tail last 100 lines from aggregated log stream (future: integrate with log viewer)

---

## 9. Implementation Phases (Detailed Plan)

This will be expanded in the implementation plan, but high-level breakdown:

**Phase 1: Foundation (Days 1-3)**
- Monorepo init (pnpm workspaces, turborepo, ESLint/Prettier)
- Docker Compose (postgres + redis)
- Prisma schema → migrations
- Shared packages: types, prompts
- Fastify skeleton with auth plugin, prisma plugin, validation plugin

**Phase 2: Core Backend (Days 4-6)**
- Auth routes (register, login, refresh) with JWT lifecycle
- Projects CRUD (with org/team scoping)
- Signals upload (file parsing: CSV/JSON/TXT)
- BullMQ setup + synthesizeQueue definition
- Worker skeleton (connection, job processor stub)

**Phase 3: Deterministic Engines (Days 7-9)**
- Implement 4 engines in packages/core
- Unit tests (≥90% coverage)
- Integration tests for engine pipelines

**Phase 4: AI Integration (Days 10-12)**
- OpenRouter client with retry logic
- Theme extraction prompt iteration (test with sample data)
- Signal linking algorithm (simple keyword match)
- End-to-end worker test (mocked AI → real engines)

**Phase 5: Frontend Core (Days 13-16)**
- Next.js setup with Tailwind + Shadcn
- Design system base (colors, typography, components)
- Auth pages (login/register)
- Layout with project switcher
- Dashboard page + ingest panel + signal list
- Projects and signals CRUD (manual theme edition)

**Phase 6: Frontend Synthesis (Days 17-19)**
- Synthesize button + job polling logic
- Roadmap view (3 columns)
- RoadmapCard component + trace drawer
- Integrate engine results into cards

**Phase 7: Polish & Observability (Days 20-21)**
- Full test suite (unit + integration + E2E)
- Pino logging across all services
- Metrics middleware in API & worker
- Admin dashboard pages
- Error boundaries + user-friendly error messages
- Loading states + skeletons

**Phase 8: Seed & Verify (Day 22)**
- Seed script with test data from spec:
  - Signal 1: CSV upload failures
  - Signal 2: Lost deals due to no SAML
  - Signal 3: PM output too generic
- Verify roadmap output produces:
  - NOW: "Fix CSV upload failures"
  - NEXT: "Implement SAML/SSO"
  - LATER: "Improve AI output clarity"
- Documentation: README, architecture diagram, deployment guide, API reference

---

## 10. Risk Assessment & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **OpenRouter rate limits / downtime** | Synthesis blocked | Medium | Implement fallback to alternative model (GPT-4o-mini), cache recent prompts for debugging |
| **Signal linking inaccurate** | Traceability weak | Medium | Start with conservative approach only link signals AI explicitly cites. Manual override later. |
| **Worker memory leaks** | Crash over time | Low | Set job timeout (10min), monitor Redis queue backlog, graceful worker restart strategy |
| **Cost overruns** (AI tokens) | Unexpected bills | High | Per-org rate limiting (X requests/day), token counting, alerts on spending thresholds, prompt optimization (minimize context) |
| **Large signal corpus (>500)** | Incomplete analysis, cost explosion | Medium | Auto-truncate to top 500 most recent, pagination for manual browsing, future: clustering/summarization pre-processing |
| **Theme duplication across runs** | Confusing roadmap bloat | Medium | Deduplication: compare title embeddings cosine similarity > 0.85, merge theme IDs into one AnalysisTheme |
| **Manual overrides break engine consistency** | Inconsistent roadmap | Medium | Store overrides separately, show "adjusted by user" flag, recalculating engines on re-synthesis |
| **Multi-tenancy data leak** | Security breach | Low | Double-check all queries include org_id filter, row-level security via Prisma middleware, audit logs |

---

## 11. Success Criteria

- **Functional**: All spec features implemented and tested
- **Performance**: Synthesis complete < 5min for 100 signals, < 10min for 500 signals
- **Reliability**: Workers auto-recover from failures, job retry success > 95%
- **Observability**: All errors logged with context, metrics available, admin sees queue health
- **UX**: Dashboard loads < 2s, roadmap view renders instantly, trace drawer opens < 500ms
- **Code quality**: TypeScript strict passes, linting clean, test coverage ≥ 90%

---

## 12. Out of Scope (v1)

- Direct API integrations (HubSpot, Zendesk, Jira OAuth). File uploads only.
- Email notifications (future: alert on analysis complete)
- Advanced admin: org billing, usage quotas, SSO for Sentix itself
- Collaboration features: comments on roadmap, @mentions, sharing
- Mobile app (responsive web only)
- Public API (internal API only)
- AI model switching (OpenRouter fixed config)
- Roadmap reordering (drag-and-drop)
- Custom retention policies per team (org-level only in v1)

---

## 13. Open Questions

1. **Revenue estimation precision**: If signals don't contain explicit dollar amounts, should the revenue engine infer from plan tiers (e.g., "we lost 3 enterprise customers" → estimate $30k each)? Or leave at 0 and let priority engine compensate with churn?
2. **Theme deduplication across analyses**: If new run discovers same theme as previous, should we:
   - Create new AnalysisTheme (preserves history but duplicates card)
   - Link to existing Theme (reduces noise but loses snapshot)?
3. **Manual override UX**: When user drags a card from NEXT to NOW, should engine:
   - Respect manual position and freeze calculations?
   - Recalculate based on new bucket (synthesis still dynamic)?
   - Store as separate "Decision" entity that overrides engine suggestion?
4. **Signal linking threshold**: How many supporting signals minimum to consider a theme valid? Single signal could be noise.
5. **Job cancellation**: If user triggers synthesis accidentally, should we support cancel? (Hard due to AI streaming, but can mark as abandoned in DB if stopped early).

---

## 14. Glossary

- **Signal**: Raw customer data point (transcript, Slack message, support ticket)
- **Theme**: AI-extracted product problem (specific, actionable)
- **Analysis**: Deterministic computation that attaches roadmap decisions to themes
- **AnalysisTheme**: Junction entity with revenue, churn, effort, priority results
- **Roadmap bucket**: NOW/NEXT/LATER prioritization outcome
- **Worker**: Background job processor (BullMQ)
- **Traceability**: Ability to see which signals contributed to which roadmap decision

---

**Appendices**

- Appendix A: API OpenAPI spec (to be generated)
- Appendix B: Prompt templates (in `packages/prompts/src/`)
- Appendix C: Docker Compose configuration (in `infra/docker/`)
- Appendix D: Seed data script (in `scripts/seed.ts`)
