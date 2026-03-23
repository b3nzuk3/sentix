# Sentix

AI-powered product operating system that synthesizes customer signals into actionable roadmaps.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start Docker Compose (Postgres + Redis):
   ```bash
   docker-compose -f infra/docker/docker-compose.yml up -d
   ```

3. Setup database:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

4. Start development:
   ```bash
   pnpm dev
   ```

Apps run on:
- Web: http://localhost:3000
- API: http://localhost:3001

## Project Structure

- `apps/` - Next.js (web), Fastify (api), BullMQ worker
- `packages/` - Shared logic (core, prompts, types, ui)
- `prisma/` - Database schema and migrations

## Scripts

- `pnpm build` - Build all apps
- `pnpm dev` - Run all apps in parallel
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
