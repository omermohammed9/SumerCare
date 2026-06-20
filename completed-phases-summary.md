# Microservices Workspace — Phases Summary

This document summaries the achievements, architectural changes, and steps completed during the development lifecycle for both the Patient Management Service and Appointment Scheduling Service.

---

## Phase 1 — Foundation & Audit

### Patient Management Service
- **Environment & Configuration:** Setup `src/.env` and `.env.example`. Enabled `dotenv` initialization at entrypoint.
- **Dependencies Audit:** Audited dependencies (`ioredis`, `winston`, `morgan`, `class-validator`, `class-transformer`).
- **TypeScript Compliance:** Configured `tsconfig.json` with strict mode enabled. Cleared all type errors.
- **Code Structure Audit:** Established standard folder structure (controllers, services, repositories, entities, DTOs, routes, middlewares).
- **Logging Audit:** Replaced raw `console.log` with Winston loggers in production paths. Morgan is configured to stream to Winston.
- **Database Configuration:** Configured TypeORM with `synchronize: true` for development. Added migration reminders.

### Appointment Scheduling Service
- **Environment & Configuration:** Setup `.env` and `.env.example`. Configured server to run on port 8000.
- **Dependencies Audit:** Audited all dependencies and verified TypeScript config is in strict mode.
- **Code Structure Audit:** Standardized layers and decoupled routes using `@decorators/express`.
- **Database Configuration:** Integrated database connection and set up a TODO to register the patient cache in subsequent phases.

---

## Phase 2 — Event-Driven Integration

### Patient Management Service (Publisher)
- **Redis Integration:** Added `ioredis` dependency and created `redisPublisher` singleton in `src/redis/redisPublisher.ts` with connection state warning loggers and retry strategies.
- **Event Dispatching:** Integrated event publishing in `PatientService.ts` for:
  - `patient.upserted` on create and update patient operations.
  - `patient.deleted` on patient deletion.
- **Graceful Shutdown:** Configured handlers for `SIGINT` and `SIGTERM` in `server.ts` to cleanly close Redis and DB connections.

### Appointment Scheduling Service (Subscriber + Cache)
- **Local Patient Cache:** Created `PatientCache` entity to replicate patient IDs and names locally inside the Appointment database, avoiding synchronous HTTP/REST lookups.
- **Event Subscription:** Created `redisSubscriber` and `subscriberService.ts` to subscribe to `patient_events` channel.
- **Cache Syncing Logic:**
  - Upon receiving `patient.upserted`, save/upsert the patient record locally.
  - Upon receiving `patient.deleted`, remove the patient from local database cache.
- **Refactoring Service:** Removed Axios dependency entirely from `AppointmentService.ts`. Verified patient existence using the local database `PatientCache`.
- **Smoke Testing:** Ran chaos and disconnect tests verifying both services can start up independently, synchronize cache elements correctly, and delete entries.

---

## Phase 3 — Resiliency & Error Handling

### Process-Level Safety
- Registered `unhandledRejection` and `uncaughtException` event handlers globally in both services' `server.ts` files to ensure all unexpected errors are logged and uncaught exceptions trigger a graceful exit.
- Formatted the global `ErrorHandlingMiddleware.ts` to capture and serialize exceptions into a standardized JSON shape:
  ```json
  {
    "status": "error",
    "message": "Human-readable error description",
    "statusCode": 400
  }
  ```
- Shielded internal server details (e.g. stack traces) from leaking to client responses during unexpected `500` errors.

### Input Validation
- Standardized request validations using `class-validator` and `class-transformer` decorators:
  - Patient DOB (`dateOfBirth`) validated using `@IsDateString()` in creation and updates DTOs.
  - Patient IDs validated using `@Min(1)` in appointment scheduling DTOs.
  - Appointment times validated against HH:MM 24-hour formats using `@Matches(/^\d{2}:\d{2}$/)`.
- Added missing decorators (e.g. `validateIdMiddlewareRequest`, `validationDataMiddleware`) to controller route configuration lists.

### Connection & Database Resiliency
- Set `maxRetriesPerRequest: null` and offline event buffers on the Redis publisher client.
- Enforced endless reconnection loops on the Redis subscriber client, with explicit `patient_events` channel resubscriptions once connections transition back to a `ready` state.
- Wrapped DB calls in `PatientService.ts` and caught constraint violations (duplicate `nationalId` / Postgres code `23505`) to gracefully return a `409 Conflict`.
- Integrated overlap check validations on appointment updates inside `AppointmentService.ts`, and returned slot conflict (`409`) or missing patient registry (`404`) errors.

---

## Phase 4 — Observability & Logging

### Structured Logging
- **Winston Logger Audit:** Configured Winston loggers for both services with standard `defaultMeta` indicating service names (`patient-management-service` and `appointment-scheduling-service`).
- **Log Rotation:** Enabled log rotation via `winston-daily-rotate-file` in production mode to save log files into daily `logs/%DATE%-combined.log` and `logs/%DATE%-error.log` volumes. Cleanly gitignored the `logs/` directory.
- **Winston Morgan Stream:** Configured Express HTTP requests to route through Morgan streaming to the Winston logger.
- **Key Event Logging:** Rewrote console logs into structured logger entries tracking creation, upserts, deletes, synchronizations, cache-miss warnings, and publishing outcomes.

### Health Check Endpoints
- **Health Check Routes:** Added `/health` check endpoints checking PostgreSQL connection connectivity and Redis publisher/subscriber status. Returns `200` under normal conditions and `503` under degraded state.
- **Startup Summaries:** Standardized startup message reporting connection environments, databases, Redis client URLs, and service ports.

### Request Tracing
- **Correlation ID Middleware:** Implemented custom request interceptors that bind incoming `x-correlation-id` headers or generate fresh UUIDs.
- **AsyncLocalStorage Logging Context:** Bound correlation IDs to async contexts using Node's `AsyncLocalStorage` so all Winston loggers implicitly log current request correlation IDs.

---

## Phase 5 — Deployment Readiness

### Containerization & Dev Orchestration
- **Dockerization:** Configured multi-stage, production-ready `Dockerfile` and `.dockerignore` configurations targeting Node 20-alpine with non-root security execution for both services.
- **Solo Dev Compose:** Setup service-specific `docker-compose.dev.yml` configs for standalone service execution.
- **Full Orchestration:** Configured a unified `docker-compose.yml` for multi-service execution (Postgres, Redis, services) with healthchecks.

### Database Migration Governance
- **TypeORM Migrations:** Disabled `synchronize` mode in production. Configured production migration runs on startup.
- **Schema Generation:** Generated initial SQL schemas for both services via TypeORM CLI (`InitialSchema.ts`).

### Environment & Production Hardening
- **Security Headers & Rate Limiting:** Integrated `helmet` and `express-rate-limit` into the middleware pipelines of both microservices.
- **Env Governance:** Standardized `.env.example` configurations. Built shared `.env` configuration file inside workspace.
- **Production Build:** Added `"build": "tsc"` pipeline compilation commands. Verified zero compile errors (`npx tsc --noEmit`).

---

## Audit Phase 1 — Security & Architecture

### Security Hardening
- **PASETO Authentication:** Implemented PASETO (v4.local) authentication middleware in both Patient Management and Appointment Scheduling services to prevent downgrade attacks.
- **Iraqi National ID Enforcement:** Standardized the `nationalId` formatting to strictly require the 12-digit Iraqi Unified National Card format (`^\d{12}$`) via `class-validator`.
- **Data Encryption at Rest:** Developed a deterministic `EncryptionTransformer` using AES-256-CBC to encrypt `nationalId` columns at rest in PostgreSQL while preserving the database `UNIQUE` constraints.

### Resiliency & High Availability
- **Redis Sentinel Orchestration:** Migrated the single-node Redis deployment in `docker-compose.yml` to a highly available Redis Sentinel topology consisting of a master, replica, and sentinel node.
- **Redis Streams:** Refactored the `ioredis` event bus from volatile Pub/Sub channels to durable Redis Streams. Replaced `publish` with `XADD` and implemented robust polling via Consumer Groups (`XREADGROUP` and `XACK`) ensuring zero message loss during Appointment Service downtime.

---

## Audit Phase 2 — Advanced Microservice Patterns & Observability

### System Resiliency
- **Circuit Breakers:** Integrated the `opossum` package across both microservices. Wrapped critical database operations (`TypeORM`) and Redis Streams (`xadd` and `Cache Sync`) in circuit breakers. This prevents cascading failures, failing fast during degraded states (50% failure rate over 10 seconds).
- **Dead Letter Queue (DLQ):** Implemented a `try/catch` mechanism in the Appointment Service's `subscriberService.ts`. Unprocessable messages (e.g. malformed payloads or persistent cache-save failures) are safely forwarded to a new `patient_events_dlq` Redis Stream along with the error reason, allowing the original message to be acknowledged (`XACK`) and preventing the consumer group from getting stuck.

### Observability & Metrics
- **Prometheus APM (Application Performance Monitoring):** Integrated `prom-client` to expose CPU, Memory, and custom histograms (HTTP request duration, DB query duration, Redis publish duration) via a dedicated `/metrics` endpoint in both services.
- **Metrics Security:** Protected the `/metrics` endpoint using `express-basic-auth` to prevent unauthorized public scraping of internal telemetry data.

---

## Audit Phase 3 — CI/CD & Documentation

### CI/CD Pipelines & Security
- **GitHub Actions:** Created a unified `.github/workflows/ci.yml` matrix pipeline running `npm ci`, `npm run build`, and `npm test` for both services.
- **Vulnerability Scanning:** Integrated `npm audit --audit-level=high` directly into the CI pipeline.

### API Documentation
- **Swagger Integration:** Integrated `swagger-ui-express` and `swagger-jsdoc` to expose OpenAPI 3.0.0 documentation on `/api-docs` across both Patient Management and Appointment Scheduling services.

### GraphQL Gateway
- **Centralized Gateway:** Bootstrapped a new `graphql-gateway` microservice running on port `4000`.
- **Schema & Resolvers:** Configured a unified schema to resolve `Patient` and `Appointment` data, acting as an aggregated facade for front-end consumption via Axios routing to internal REST API endpoints.

---

## Audit Phase 4 — Code Quality & Technical Debt

### Code Quality & Formatting
- **Linting & Formatting:** Initialized `eslint`, `prettier`, and `lint-staged` with `husky` pre-commit hooks to automatically enforce code style conventions and prevent badly formatted code from being committed in both Patient Management and Appointment Scheduling repositories.
- **Type Safety:** Audited both codebases for loose types and successfully replaced arbitrary `any` types within the error catching blocks (`ErrorHandlingMiddleware.ts`, `PatientController.ts`, `subscriberService.ts`) with robust `unknown` types coupled with `instanceof Error` type-guards.

### Testing Infrastructure
- **Jest Setup:** Installed `jest` alongside `ts-jest` and `@types/jest` across both microservices. Created the foundational `jest.config.js` setups, allowing comprehensive unit tests (to be written in Phase 6) to run smoothly.

### Database Indexing
- **Query Optimization:** Implemented `@Index()` decorators inside TypeORM entities for frequently queried columns to prevent sequential scans under heavy load.
  - Added index to `nationalId` within `Patient.ts`.
  - Added indexes to `patientId` and `date` within `Appointment.ts`.
- **Migrations:** Successfully generated production-ready TypeORM migrations mapping to the new index constraints.

---

## Audit Phase 5 — Code Readability, Reusability & Comments

### Code Readability & Standards
- **Interfaces & Types:** Designed and applied strongly typed interfaces (`IPatientService`, `IPatientRepository`, `IAppointmentService`, `IAppointmentRepository`) across both microservices to harden layer boundaries.
- **Custom Error Classes:** Extracted hardcoded generic error objects into reusable exception classes (`NotFoundError`, `ConflictError`, `BadRequestError`, `ServiceUnavailableError`) to improve maintainability and DRY principles.
- **JSDoc & Explanations:** Added top-level JSDoc comments to foundational services (`PatientRepository`, `AppointmentRepository`, and `subscriberService.ts`) to clarify dependencies and runtime behaviors.
- **Utility Abstractions:** Isolated custom error handlers into shared util directories (`src/utils/CustomErrors.ts`) and streamlined `circuitBreaker.ts` failure modes.
- **Service Refactoring:** Augmented `AppointmentService` and `PatientService` logic and error propagations to be resilient and self-documenting.

---

## Audit Phase 6 — Comprehensive Testing Phase

### Unit & Integration Testing
- **Patient Management Service:** Created Jest test suite for `PatientService.ts`, fully mocking the TypeORM repository, Redis publisher, and metrics dependencies. Covered all CRUD operations and duplicate ID conflict handlers. Added unit tests for `PatientController.ts` and `ErrorHandlingMiddleware.ts` to validate proper HTTP response mapping and Winston error serialization.
- **Appointment Scheduling Service:** Created Jest test suite for `AppointmentService.ts`, covering patient registry existence checks via local cache, appointment slot overlap detection, and standard CRUD behaviors.
- **Integration Tests:** Implemented comprehensive integration tests across both services using `testcontainers`. Spun up isolated PostgreSQL and Redis instances dynamically to test true database inserts and cross-service Redis Stream event processing (e.g., syncing `PatientCache`). Tests were integrated seamlessly into the Jest pipeline with optimized timeouts.
- **Jest ESM Compatibility:** Added `moduleNameMapper` configurations to both Jest environments to correctly mock standard `uuid` ESM imports.

### End-to-End & Load Testing
- **E2E Critical Path:** Created `tests/e2e/critical-path.test.js` using Supertest to validate the full workflow: creating a patient -> waiting for Redis sync -> scheduling an appointment.
- **Load Testing:** Built `tests/load/artillery.yml` testing scripts defining warm-up and sustained load phases to evaluate the `503` circuit breakers and maximum concurrency thresholds.

---

## Phase 7 — Gateway & Continuous Deployment (GitOps)

### API Gateway Integration (NGINX)
- **NGINX Configuration:** Created `nginx.conf` routing rules for `patient-service` (port 5000) and `appointment-service` (port 8000), acting as a reverse proxy for all incoming traffic on port 80.
- **Advanced Enterprise Security:** Upgraded the gateway to enforce strict security policies:
  - **HSTS:** `Strict-Transport-Security` configured for 1 year.
  - **CSP:** `Content-Security-Policy` restricting script and media execution to `'self'`.
  - **Privacy:** Added `Referrer-Policy` and a strict `Permissions-Policy` disabling microphone/camera/geolocation APIs.
  - **Strict CORS:** Removed wildcard origins. Integrated a dynamic map block limiting `Access-Control-Allow-Origin` to specific internal front-end domains (`https://patient-portal.local`, etc).
  - Added foundational headers (`X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`) and API rate limiting (`10r/s` with burst of 20).
- **Docker Compose:** Added the `api-gateway` service to `docker-compose.yml`, mounting the `nginx.conf` as a volume.

### GitOps CI/CD Pipeline
- **GitHub Actions Workflow:** Created `.github/workflows/docker-build-push.yml` to automatically build Docker images and push them to GitHub Container Registry (`ghcr.io`) upon merges to the `main` branch.
- **Automated Deployments:** Integrated `watchtower` into the `docker-compose.yml` file to continuously poll for new container images and automatically update running services with zero downtime.
- **Dockerfile Enhancement:** Updated the `Dockerfile` in both services to use `npm install` instead of `npm ci` so that dependencies are automatically and dynamically fetched properly during build stages.

---

## Phase 8 — Innovation & Advanced Features

### AI-Analytics Service
- **Python/FastAPI Stack:** Created a new microservice (`ai-analytics-service`) to act as the AI inference and ML engine.
- **Predictive No-Show Analytics:** Implemented a script (`generate_data.py`) to create synthetic datasets and train a Random Forest classifier using `scikit-learn` to predict appointment no-shows.
- **AI-Driven Triage:** Developed a mock LLM integration endpoint for patient symptom triage, falling back gracefully when API keys are absent.
- **Automated Follow-ups:** Integrated an `APScheduler` cron job to simulate sending post-visit follow-up messages via WhatsApp/SMS.

### Omnichannel & Wearable Integrations
- **WhatsApp Webhook:** Added `ingestWhatsAppMessage` mutation to the `graphql-gateway` schema to ingest Twilio/WhatsApp interactions.
- **Wearable Telemetry:** Updated the `Patient` entity with a `wearableTelemetry` JSONB column to support data from Apple Health/Google Fit, and generated corresponding TypeORM migrations.

### Smart In-Clinic Experience (Real-Time)
- **WebSockets:** Installed and initialized `socket.io` in the `appointment-scheduling-service`, storing the global instance to emit events.
- **Live Digital Queue:** Configured the `AppointmentService.ts` to emit `queue-update` socket events immediately whenever an appointment status is modified (e.g., to `CHECKED_IN` or `IN_PROGRESS`).
- **WebRTC Telemedicine:** Implemented native signaling events (`join-room`, `offer`, `answer`, `ice-candidate`) over Socket.io to support browser-based video consultations.

---

## Phase 9 — Security, Identity, and Audit Architecture

### Role-Based Access Control (RBAC)
- **User Entity:** Created a robust `User.ts` entity within the Patient Management Service to serve as the system's identity provider, encompassing fields for `username`, `passwordHash`, `lastLoginIp`, and role enums (`ADMIN`, `DOCTOR`, `FRONT_DESK`).
- **Middleware Enforcement:** Implemented `roleMiddleware.ts` across both services. This leverages the PASETO token payloads previously extracted by `authMiddleware.ts` to strictly enforce role constraints on specific API endpoints.

### Immutable Audit Logging
- **Redis Streams Ingestion:** Developed `AuditMiddleware.ts` to intercept critical API routes and push forensics data (`action`, `actorId`, `ipAddress`, `userAgent`, `metadata`) non-blockingly to Redis Streams.
- **Background Worker:** Built an `AuditWorker.ts` in both the Patient Management and Appointment Scheduling services leveraging `node-cron` and `XREADGROUP` to perform high-throughput bulk inserts of stream data into localized PostgreSQL `AuditLog` tables.
- **Entity Creation:** Created the foundational `AuditLog.ts` TypeORM entities to permanently persist the immutable audit trails.

### Patient Identity & 2FA
- **Database Schema Extensions:** Extended the `Patient.ts` entity to support enhanced identity verification, adding columns for `twoFactorSecret`, `isTwoFactorEnabled`, `deviceFingerprint`, and `loginHistory`.
- **Identity Service Module:** Engineered `IdentityService.ts` utilizing `otplib` to securely generate TOTP configurations and `qrcode` to render scannable provisioning URLs.
- **Device Fingerprinting:** Implemented a backend heuristic leveraging crypto hashing of immutable request headers (`User-Agent`, `Accept-Language`) to generate device fingerprints, maintaining a rotating window of the 10 most recent logins for anomaly detection.

---

## Phase 12 — Import Optimization and Code Cleanup

### Path Aliasing Configuration
- **TypeScript & Jest Integration:** Integrated `tsc-alias` and `tsconfig-paths` across both microservices. Added `paths: { "@/*": ["src/*"] }` into `tsconfig.json` and mapped module paths in `jest.config.js`.
- **Runtime Resolution:** Modified `dev` and `start` scripts to run with `-r tsconfig-paths/register` to support absolute path resolution inside `ts-node-dev`. Added `tsc-alias` to the build scripts to output standard relative paths into the compiled `dist/` directories.

### 12. Codebase Refactoring
- **Code Organization:** Globally refactored relative imports to use absolute path aliases (e.g. `@/utils`), reducing spaghetti imports and ensuring long-term maintainability.

## Phase 13: Microservices Decoupling & Architecture Refactoring
### 1. Monorepo Migration (Turborepo)
- **Repository Consolidation:** Transitioned the project to a Turborepo-based monorepo structure, moving services into an `apps/` directory.
- **Shared Core Package:** Extracted common types, interfaces, and custom error classes into `packages/shared-core` to eliminate code duplication while maintaining domain separation.

### 2. Distributed Data Consistency (Saga Pattern)
- **Eventual Consistency:** Implemented the Saga Pattern using Redis Streams to maintain data integrity across physically decoupled databases.
- **Automated Cascading:** Configured the `PatientDeleted` event publisher in the Patient Service and a corresponding subscriber in the Appointment Service to automatically cancel orphaned appointments.

### 3. Data Aggregation (GraphQL Gateway / BFF)
- **Apollo Server Migration:** Refactored the `graphql-gateway` to use Apollo Server.
- **Backend-for-Frontend (BFF):** Implemented aggregated GraphQL resolvers allowing the frontend to query an `Appointment` and automatically resolve its nested `Patient` details without making multiple HTTP requests.
- **Edge Routing:** Updated the NGINX API Gateway to correctly proxy `/graphql/` traffic to the new Apollo Server.

### 4. Provider Management Service Initialization
- **Scaffolding & Architecture:** Initialized the `provider-management-service` inside the Turborepo `apps/` directory, conforming to Phase 13 decoupling rules.
- **Data Consistency:** Setup `redisPublisher` to emit Saga events (`provider.created`, `provider.updated`, `provider.deleted`) over Redis Streams for cross-service replication.
- **Shared Core Adoption:** Integrated standard types and custom exception classes from `packages/shared-core` to maintain DRy codebase logic.
- **Containerization:** Configured Dockerfile and appended the service along with its localized `postgres-provider` database to the root `docker-compose.yml`.

## Phase 14: Hospital Management Ecosystem Expansion
### 1. Medical Records Service
- **Initialization:** Bootstrapped service with PostgreSQL and RabbitMQ.
- **Entity:** Created Encounter entity with Application-Level Encryption for PHI (`diagnosis`, `notes`).
- **Automation:** Subscribed to `appointment.completed` events for automated draft generation.

### 2. Billing Service
- **Initialization:** Bootstrapped service with PostgreSQL and RabbitMQ.
- **Entity:** Created `Invoice` and `InsuranceClaim` entities.
- **Automation:** Subscribed to `encounter.finalized` events for automatic invoice generation.

### 3. Saga Orchestration & Decoupling
- **RabbitMQ Bus:** Migrated Provider Service and Audit Worker from Redis to RabbitMQ for durable event streaming.
- **Compensating Transactions:** Implemented distributed rollbacks (Encounter status updates to `FAILED_BILLING` upon Invoice generation failures).

### 4. Orchestration & Gateway
- **Docker Compose:** Containerized `medical-records-service` and `billing-service` and orchestrated them with their dedicated `postgres` databases.
- **NGINX:** Added strict rate-limited, CORS-protected reverse proxy routing for `/api/encounters/` and `/api/invoices/`.

## Phase 15: Ecosystem Testing Expansion
### 1. Test Infrastructure Setup
- Bootstrapped `jest`, `ts-jest`, and `supertest` into `provider-management-service`, `medical-records-service`, and `billing-service`.
- Mapped internal path aliasing (`@/*`) inside dedicated `jest.config.js` files.

### 2. Isolated Saga Unit Testing
- **ProviderService.test.ts:** Mocked TypeORM and RabbitMQ to test provider creation rules.
- **EncounterService.test.ts:** Validated the `appointment.completed` automated draft listener and the `billing.failed` Saga rollback listener, proving Encounters correctly fall back to `FAILED_BILLING` without touching a real database.
- **BillingService.test.ts:** Validated the `encounter.finalized` invoice generator listener and its error catching.

### 3. Comprehensive End-to-End Testing
- **Saga Workflow Verification:** Authored `tests/e2e/saga-workflow.test.js` using `supertest` to run a fully automated integration journey spanning all 5 microservices:
  *Patient Registration -> Provider Creation -> Booking -> Draft Encounter Auto-generation -> Invoice Auto-generation -> Saga Compensation Rollbacks.*
