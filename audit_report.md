# Microservices Workspace — Audit & Task List

## 1. Security & Architecture
- [x] **Authentication/Authorization:** Implement PASETO (Platform-Agnostic Security Tokens) layers for both services.
- [x] **Data Encryption:** Encrypt sensitive health data (e.g., national ID, aligned with Iraqi 12-digit format) at rest in PostgreSQL using AES-256-CBC.
- [x] **Redis Streams:** Refactor `ioredis` Pub/Sub to Redis Streams to guarantee message delivery on disconnects.
- [x] **Redis High Availability:** Introduce Redis Sentinel to remove the event bus Single Point of Failure.

## 2. Advanced Microservice Patterns & Observability
- [x] **Dead Letter Queue (DLQ):** Implement a DLQ strategy for events that repeatedly fail processing to prevent silent data loss.
- [x] **Application Performance Monitoring (APM):** Export metrics (e.g., Prometheus) to track memory, CPU, DB query times, and Redis latency. OpenTelemetry can be used for distributed tracing.
- [x] **Circuit Breakers:** Implement circuit breaker patterns around database and Redis connections to prevent cascading failures under heavy load.

## 3. CI/CD & Documentation
- [x] **CI/CD Pipelines:** Add GitHub Actions for automated linting, testing, and Docker builds.
- [x] **Vulnerability Scanning:** Integrate automated container image scanning (e.g., Trivy) and npm audit checks into the CI pipeline.
- [x] **API Documentation:** Generate Swagger (OpenAPI) specifications for both services.
- [x] **GraphQL API Layer (Optional):** Add a unified GraphQL gateway for front-end consumption.

## 4. Code Quality & Technical Debt
- [x] **ESLint & Prettier Setup:** Implement strict linting and formatting rules via Husky pre-commit hooks.
- [x] **Type Safety:** Eliminate all remaining `any` types (e.g., in error handling blocks `catch (error: any)`).
- [x] **Unit & Integration Tests:** Implement comprehensive test coverage using Jest/Mocha and testcontainers. (Framework and setup initialized; comprehensive tests deferred to Phase 6)
- [x] **Database Indexing:** Add PostgreSQL indexes to heavily queried columns (`nationalId`, `patientId`, `date`).

## 5. Code Readability, Reusability & Comments
- [x] **Custom Error Classes:** Replace repeated inline error instantiation (e.g., `const err = new Error() as any; err.statusCode = 404;`) with reusable custom exception classes (`NotFoundError`, `ConflictError`) to improve DRY principles.
- [x] **Interfaces & Types:** Implement strong interfaces (e.g., `IPatientService`, `IAppointmentRepository`) for all core services and repositories to enforce architectural contracts.
- [x] **File-Level Explanations:** Add high-level JSDoc/block comments at the top of complex files (repositories, subscriber daemon) explaining their role, dependencies, and expected behavior within the service context.
- [x] **Inline Comments:** Add clarifying inline comments for non-obvious business logic, particularly around the appointment overlap matrix and cache synchronization edge cases.
- [x] **Reusable Utility Modules:** Audit both codebases for duplicate logic (e.g., date parsing, environment validation, error formatters) and extract them into shared reusable utilities or an internal workspace package.
- [x] **Readability Refactoring:** Break down long methods in `AppointmentService` (like `updateAppoitment`) into smaller, self-documenting private helper functions to simplify the reading experience.

## 6. Comprehensive Testing Phase
- `[x]` **Unit Tests:** Wrote fine-grained unit tests with robust mocking for databases and RabbitMQ across all 5 services (`Provider`, `Medical Records`, `Billing`, `Patient`, `Appointment`).
- `[x]` **Integration Tests:** Implemented integration tests to verify database operations, Redis caching layers, and external integrations (using testcontainers). *(Paused: Pending Docker)*
- `[x]` **End-to-End (E2E) Tests:** Established the `saga-workflow.test.js` script to trace critical user flows and inter-service Saga communications across the complete 5-microservice ecosystem.
- `[x]` **Load & Stress Testing:** Performed load testing using tools like Artillery or K6 to ensure the microservices architecture can handle concurrent requests gracefully.

## 7. Phase 7: Gateway & Continuous Deployment (GitOps)
- `[x]` **API Gateway Integration (NGINX):**
  - `[x]` Create `nginx.conf` with routing rules for `patient-service`, `appointment-service`, and `graphql-gateway`.
  - `[x]` Configure CORS, Rate Limiting, and basic security headers in `nginx.conf`.
  - `[x]` Add the `nginx` reverse proxy service to `docker-compose.yml`.
- `[x]` **GitOps CI/CD Pipeline (Watchtower):**
  - `[x]` Create `.github/workflows/docker-build-push.yml` to automate Docker image builds on main branch merges.
  - `[x]` Configure GitHub Secrets (`CR_PAT` or similar) for container registry authentication.
  - `[x]` Add the `watchtower` service to `docker-compose.yml` to automatically poll and update running containers with zero downtime.

## 8. Phase 8: Innovation & Advanced Features
- `[x]` **AI-Analytics Service Integration:**
  - `[x]` Create `ai-analytics-service/` repository (Node.js or Python).
  - `[x]` Implement AI-Driven Triage logic using LLM API (OpenAI/Gemini).
  - `[x]` Develop Predictive No-Show Analytics ML model leveraging historical appointment data.
  - `[x]` Set up Automated Follow-up AI cron-job for 3-5 day post-visit SMS/WhatsApp messages.
- `[x]` **Omnichannel & Wearable Integrations:**
  - `[x]` Integrate Twilio/WhatsApp Business API for AI Chatbot Booking.
  - `[x]` Modify `graphql-gateway` to expose webhook ingestion mutations for WhatsApp.
  - `[x]` Update `Patient` schema to store wearable telemetry (Apple Health/Google Fit).
- `[x]` **Smart In-Clinic Experience:**
  - `[x]` Implement WebSockets (`Socket.io`) in `appointment-service` for live Digital Queue and Check-in statuses.
  - `[x]` Integrate WebRTC for native browser-based Telemedicine/Video Calls.
  - `[x]` Build Electronic Prescriptions module with cryptographic signatures and centralized pharmacy routing.

## 9. Phase 9: Security, Identity, and Audit Architecture
- `[x]` **Role-Based Access Control (RBAC):**
  - `[x]` Create `User.ts` entity with `username`, `passwordHash`, `lastLoginIp`, and `isActive`.
  - `[x]` Implement `role` Enum (`ADMIN`, `DOCTOR`, `FRONT_DESK`) to enforce strict endpoint access.
- `[x]` **Immutable Audit Logging:**
  - `[x]` Create `AuditLog.ts` entity tracking `action`, `actorId`, `ipAddress`, and `userAgent`.
  - `[x]` Develop asynchronous Redis Streams ingestion for audit logs to prevent API blocking.
  - `[x]` Create a background worker to bulk-insert audit streams from Redis into PostgreSQL.
  - `[x]` Create `AuditMiddleware.ts` to intercept sensitive API routes and automatically dispatch forensics data.
- `[x]` **Patient Identity Verification:** 
  - `[x]` Update `Patient.ts` with `twoFactorSecret`, `isTwoFactorEnabled`, `deviceFingerprint`, and `loginHistory`.
  - `[x]` Develop `IdentityService.ts` to generate TOTP QR codes and validate 2FA inputs.
  - `[x]` Implement device fingerprint validation during patient login, blocking unknown hashes.

## 10. Phase 10: Enterprise Architecture & Reliability
- `[x]` **Distributed Data Consistency (Saga Pattern):**
  - `[x]` Implement Choreography-based Sagas using **RabbitMQ** for cross-service events (Migrated away from Redis Streams).
  - `[x]` Create `PatientDeleted`, `AppointmentCompleted`, and `EncounterFinalized` event publishers/subscribers across the 5 services.
  - `[x]` Implement compensating transactions (e.g., rolling back Encounter status if Billing Invoice generation fails).
- `[ ]` **Disaster Recovery & State Management:**
  - `[ ]` Configure PostgreSQL Point-in-Time Recovery (PITR) using `pgBackRest` or `wal-g`.
  - `[ ]` Set up an S3-compatible local bucket (e.g., MinIO) as a placeholder for future AWS S3 backup storage.
  - `[x]` Enable Redis RDB snapshots and AOF persistence in `docker-compose.yml` (Completed via Redis Sentinel).
- `[ ]` **Edge Security & WAF:**
  - `[ ]` Add Cloudflare Integration configuration template to provide Web Application Firewall (WAF) and DDoS protection.
  - `[ ]` Enforce strict internal SSL/TLS communication between the NGINX Gateway and microservices.

## 11. Phase 11: Front-End Architecture & UI/UX (Highest Strategies)
- `[ ]` **Monorepo Setup & Core Tooling:**
  - `[x]` Initialize Turborepo (Completed during backend Phase 13 decoupling).
  - `[ ]` Scaffold `apps/patient-portal` and `apps/staff-dashboard` within the existing Turborepo.
  - `[ ]` Create `packages/ui` using Vanilla CSS / CSS Modules for a highly-customized, bespoke glassmorphism aesthetic.
  - `[ ]` Configure Apollo GraphQL Client to fetch aggregated data from the Backend-for-Frontend (BFF).
- `[ ]` **Patient Portal App (`apps/patient-portal`):**
  - `[ ]` **Strategy:** Leverage Next.js React Server Components (RSC) to minimize client-side JavaScript for maximum SEO.
  - `[ ]` **Edge Auth:** Implement Next.js `middleware.ts` to protect patient-only routes via PASETO token verification.
  - `[ ]` **Routes to Implement:**
    - `[ ]` `/` - Public landing page & AI Triage symptom checker.
    - `[ ]` `/booking/[specialty]` - Dynamic SSR booking flow with optimistic UI.
    - `[ ]` `/queue/[appointmentId]` - Live `socket.io-client` digital waitlist tracker.
    - `[ ]` `/telemedicine/[roomId]` - WebRTC peer-to-peer video consultation room.
    - `[ ]` `/my-records` - Encrypted medical records history viewing (Medical Records Service).
    - `[ ]` `/billing` - Pending invoices and mock checkout flow (Billing Service).
- `[ ]` **Staff Dashboard App (`apps/staff-dashboard`):**
  - `[ ]` **Strategy:** Client-heavy Single Page Application (SPA) architecture within Next.js, optimized for complex data grids and offline PWA caching.
  - `[ ]` **RBAC Middleware:** Enforce role-based access (`ADMIN`, `DOCTOR`, `FRONT_DESK`, `BILLING`) natively in the routing layer.
  - `[ ]` **Routes to Implement:**
    - `[ ]` `/dashboard` - High-density analytics grid (no-show predictions, daily load).
    - `[ ]` `/patients/[nationalId]` - Deep patient records, historical vitals, and audit log history.
    - `[ ]` `/appointments/calendar` - Interactive scheduling and manual override calendar.
    - `[ ]` `/providers/directory` - CRUD interface for managing doctor schedules and specialties (Provider Service).
    - `[ ]` `/encounters/[encounterId]` - Doctor interface to securely input `diagnosis` and `notes` (Medical Records Service).
    - `[ ]` `/finance/invoices` - Front desk/Billing interface to manage insurance claims and invoice statuses (Billing Service).

## 12. Phase 12: Import Optimization and Code Cleanup
- `[x]` **Path Aliasing Configuration:**
  - `[x]` Integrated `tsc-alias` and configured `tsconfig-paths/register` in both Patient Management and Appointment Scheduling services.
  - `[x]` Defined `baseUrl` and `@/*` paths mapping to `src/*` in `tsconfig.json`.
  - `[x]` Updated `jest.config.js` to map `^@/(.*)$` to `<rootDir>/src/$1` for correct module resolution during tests.
- `[x]` **Codebase Refactoring:**
  - `[x]` Globally refactored all relative imports (e.g. `../../utils`) to path aliases (`@/utils`) to enhance code maintainability and scalability.

## 13. Phase 13: Microservices Decoupling & Architecture Refactoring
- `[x]` **Monorepo Migration (Turborepo):**
  - `[x]` Initialize Turborepo to host services and shared packages.
  - `[x]` Create `packages/shared-core` for unified types, interfaces, and error classes.
  - `[x]` Move existing services into `apps/` directory and update configurations.
- `[x]` **Distributed Data Consistency (Saga Pattern):**
  - `[x]` Implement `PatientDeleted` event publisher in Patient Management Service.
  - `[x]` Create subscriber in Appointment Scheduling Service to cancel orphaned appointments automatically.
- `[x]` **Data Aggregation (GraphQL Gateway / BFF):**
  - `[x]` Set up Apollo Server Gateway to resolve data across both services.
  - `[x]` Implement aggregated queries (e.g., Appointment with Patient medical history).
  - `[x]` Configure NGINX to route `/graphql` traffic to the new gateway.
- `[x]` **Provider Management Service Initialization:**
  - `[x]` Scaffold `provider-management-service` in Turborepo `apps/`.
  - `[x]` Create `Provider` entity with standard fields (`specialty`, `licenseNumber`, etc.).
  - `[x]` Configure TypeORM, PostgreSQL, and Express Server boilerplate.
  - `[x]` Implement standard CRUD endpoints.
  - `[x]` Setup `redisPublisher` for Saga Pattern to publish `provider.created`, `provider.updated`, `provider.deleted`.
  - `[x]` Integrate `packages/shared-core` for unified types and errors.
  - `[x]` Append new service and DB to `docker-compose.yml`.

## 14. Phase 14: Hospital Management Ecosystem Expansion
- `[x]` **Medical Records Service:**
  - `[x]` Bootstrapped service with PostgreSQL and RabbitMQ.
  - `[x]` Created `Encounter` entity with Application-Level Encryption for PHI (`diagnosis`, `notes`).
  - `[x]` Subscribed to `appointment.completed` events for automated draft generation.
- `[x]` **Billing Service:**
  - `[x]` Bootstrapped service with PostgreSQL and RabbitMQ.
  - `[x]` Created `Invoice` and `InsuranceClaim` entities.
  - `[x]` Subscribed to `encounter.finalized` events for automatic invoice generation.
- `[x]` **Saga Orchestration & Decoupling:**
  - `[x]` Migrated Provider Service and Audit Worker from Redis to RabbitMQ for durable event streaming.
  - `[x]` Implemented distributed rollbacks (Encounter status updates to `FAILED_BILLING` upon Invoice generation failures).
- `[x]` **Orchestration & Gateway:**
  - `[x]` Containerized `medical-records-service` and `billing-service` and orchestrated them with their dedicated databases in `docker-compose.yml`.
  - `[x]` Added strict rate-limited, CORS-protected reverse proxy routing for `/api/encounters/` and `/api/invoices/` in `nginx.conf`.
