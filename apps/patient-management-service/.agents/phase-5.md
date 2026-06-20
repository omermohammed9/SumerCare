# Phase 5 — Deployment Readiness

> **Goal:** Make both services production-deployable — Dockerfiles, Docker Compose, TypeORM migrations, env var governance, `.env.example`, README files, and final production hardening.
> **Model:** `claude-sonnet` (Docker config, migration strategy, production security decisions)
> **Prerequisite:** Phase 4 gate must be fully passed
> **Gate:** `docker-compose up` spins up the full system; all smoke tests from Phase 2 pass in containerized environment

---

## 📋 Patient Management Service — Dockerfile

### 5.1 Create Dockerfile
- [x] Create `Dockerfile` at project root:
  ```dockerfile
  # ── Build Stage ─────────────────────────────────────────────
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY tsconfig.json ./
  COPY src ./src
  RUN npm run build

  # ── Production Stage ────────────────────────────────────────
  FROM node:20-alpine AS production
  WORKDIR /app
  ENV NODE_ENV=production

  # Copy only production artifacts
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  COPY package.json ./

  # Non-root user for security
  RUN addgroup -S appgroup && adduser -S appuser -G appgroup
  USER appuser

  EXPOSE 5000
  CMD ["node", "dist/server.js"]
  ```
- [x] Verify `npm run build` compiles TypeScript to `dist/`
- [x] Confirm `tsconfig.json` has `"outDir": "./dist"` and `"rootDir": "./src"`

### 5.2 Create `.dockerignore`
- [x] Create `.dockerignore` at project root:
  ```
  node_modules
  dist
  .git
  .env
  logs
  *.log
  .idea
  coverage
  ```

### 5.3 Create `docker-compose.dev.yml` (Solo Dev Run)
- [x] Create `docker-compose.dev.yml` at project root:
  ```yaml
  version: '3.9'
  services:
    postgres-patient:
      image: postgres:15-alpine
      environment:
        POSTGRES_DB: PatientManagementService
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
      ports:
        - "5432:5432"

    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
  ```

---

## 📋 Appointment Scheduling Service — Dockerfile

### 5.4 Create Dockerfile
- [x] Create `Dockerfile` at project root (same multi-stage pattern, `EXPOSE 8000`)
- [x] Confirm `npm run build` output goes to `dist/`

### 5.5 Create `.dockerignore`
- [x] Same content as Patient Service `.dockerignore`

### 5.6 Create `docker-compose.dev.yml`
- [x] Create with postgres-appointment on port `5433:5432` and redis on `6379:6379`

---

## 📋 TypeORM Migration Strategy

### 5.7 Disable `synchronize` in Production
- [x] In both `PostgresDataSourceOptions.ts` files, update:
  ```typescript
  synchronize: process.env.NODE_ENV !== 'production',
  ```
- [x] Add `migrations` array to DataSourceOptions:
  ```typescript
  migrations: ['dist/migration/*.js'],
  migrationsRun: process.env.NODE_ENV === 'production',
  ```

### 5.8 Generate Initial Migration — Patient Service
- [x] Add migration script to `package.json`:
  ```json
  "migration:generate": "typeorm migration:generate -d src/Database/database.ts",
  "migration:run": "typeorm migration:run -d src/Database/database.ts",
  "migration:revert": "typeorm migration:revert -d src/Database/database.ts"
  ```
- [x] Run: `npm run migration:generate -- src/migration/InitialSchema`
- [x] Verify generated file in `src/migration/` — review SQL for correctness
- [x] Commit migration file

### 5.9 Generate Initial Migration — Appointment Service
- [x] Same process — generates migrations for `appointment` and `patient_cache` tables
- [x] Review: `patient_cache` table must have `id` as non-autoincrement PK

---

## 📋 Environment Variable Governance

### 5.10 Create `.env.example` — Patient Management Service
- [x] Ensure `.env.example` exists at project root with:
  ```ini
  NODE_ENV=development
  PORT=5000
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=your_password_here
  DB_DATABASE=PatientManagementService
  REDIS_URL=redis://localhost:6379
  SERVICE_NAME=patient-management-service
  ```
- [x] Verify `.env` is in `.gitignore` — never committed

### 5.11 Create `.env.example` — Appointment Scheduling Service
- [x] Ensure `.env.example` with:
  ```ini
  NODE_ENV=development
  PORT=8000
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=your_password_here
  DB_DATABASE=AppointmentSchedulingService
  REDIS_URL=redis://localhost:6379
  SERVICE_NAME=appointment-scheduling-service
  ```

### 5.12 Create Shared `.env` for microservices-workspace
- [x] Create `microservices-workspace/.env`:
  ```ini
  PATIENT_DB_USER=postgres
  PATIENT_DB_PASSWORD=postgres
  APPOINTMENT_DB_USER=postgres
  APPOINTMENT_DB_PASSWORD=postgres
  ```
- [x] Add to `microservices-workspace/.gitignore`

---

## 📋 Production Hardening — Both Services

### 5.13 Security Headers
- [x] Install `helmet`: `npm install helmet`
- [x] Add `app.use(helmet())` before routes in both services
- [x] This adds: `X-Frame-Options`, `X-XSS-Protection`, `Content-Security-Policy`, etc.

### 5.14 Rate Limiting (Optional but Recommended)
- [x] Install `express-rate-limit`: `npm install express-rate-limit`
- [x] Add to both services:
  ```typescript
  import rateLimit from 'express-rate-limit';
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
  ```

### 5.15 Remove `synchronize` Reminder
- [x] Confirm `synchronize: process.env.NODE_ENV !== 'production'` in both services
- [x] Confirm `NODE_ENV=production` is set in Docker Compose / Dockerfile ENV

### 5.16 Production `npm run build` Verification
- [x] Run `npm run build` in Patient Management Service → `dist/` generated, no errors
- [x] Run `npm run build` in Appointment Scheduling Service → `dist/` generated, no errors
- [x] Run `node dist/server.js` in each → services start correctly

---

## 📋 Full Stack Docker Compose Test

### 5.17 Build Docker Images
- [x] Navigate to `Desktop/microservices-workspace/`
- [x] Run: `docker-compose build`
- [x] Confirm both images build successfully (no errors)

### 5.18 Full Stack Startup
- [x] Run: `docker-compose up`
- [x] Confirm startup order: Redis → Postgres → Patient Service → Appointment Service
- [x] Confirm all healthchecks pass (check `docker ps` — all `healthy`)
- [x] Confirm `GET http://localhost:5000/health` → `200`
- [x] Confirm `GET http://localhost:8000/health` → `200`

### 5.19 Container Smoke Tests
- [x] Repeat all Phase 2 smoke tests (2.15–2.18) against containerized services
- [x] Confirm Redis Pub/Sub works within Docker network (services use `redis://redis:6379`)
- [x] Confirm patient cache syncs correctly across containers

### 5.20 Graceful Shutdown Test
- [x] Run: `docker-compose stop` (sends SIGTERM)
- [x] Confirm Patient Service logs: `[Server] Graceful shutdown complete`
- [x] Confirm Appointment Service logs: `[Server] Graceful shutdown complete`
- [x] No `forced shutdown` timeout log entries

---

## 📋 Final Code Cleanup

### 5.21 Dead Code Removal
- [x] Evaluate `src/fetchPatientDetails.ts` (Appointment Service) — delete if unused
- [x] Remove all commented-out code blocks that are no longer relevant
- [x] Remove all Phase 1–4 TODO comments that have been resolved
- [x] Ensure no `console.log` in service/repository/event handler layers

### 5.22 Final TypeScript Audit
- [x] `npx tsc --noEmit` in both services — 0 errors
- [x] No `any` types remaining (use `unknown` + type guards)
- [x] All public service methods have JSDoc comments
- [x] All entity files have top-of-file comment explaining the entity

### 5.23 Git Hygiene
- [x] Both projects have clean `git status` (no untracked env or log files)
- [x] `node_modules`, `dist`, `logs`, `.env` all in `.gitignore`
- [x] Final commit message: `chore: phase 5 — production readiness complete`

---

## ✅ Phase 5 Gate — Production Readiness

- [x] `docker-compose up` from `microservices-workspace/` — all containers healthy
- [x] All Phase 2 smoke tests pass in containerized environment
- [x] `npx tsc --noEmit` — 0 errors in both services
- [x] `synchronize: false` when `NODE_ENV=production`
- [x] Migrations generated and committed
- [x] `.env.example` files committed (no secrets)
- [x] Health endpoints respond correctly in containers
- [x] Graceful shutdown works cleanly
- [x] No dead code, no `console.log` in service layers, no `any` types
- [x] User sign-off: **☐ System is production ready ✅**
