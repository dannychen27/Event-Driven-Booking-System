# Event-Driven Booking System — Project Roadmap

This document is the source of truth for project milestones, planned improvements,
deferred work, and important technical decisions.

Update it when significant work is completed, merged, approved, or deliberately deferred.

## 2. Completed Milestones

## Documentation Commit

- [x] Phase 5 reliability and structured logging status recorded.
- [x] AI search implementation audit recorded.
- [x] Remaining AI search work categorized.
- [x] README links to the project roadmap.
- [x] README completion checkboxes updated.
- [x] Whitespace validation passed.
- [x] Documentation changes committed.

## Phase 5 — Reliability Audit

- [x] Database safety and explicit database-name validation.
- [x] Protected test-database reset.
- [x] Unit, frontend, E2E, integration, and database-safety test coverage in CI.
- [x] Explicit backend and frontend production-build verification in CI.
- [x] Graceful NestJS application shutdown using `app.enableShutdownHooks()`.
- [x] PostgreSQL connection-pool cleanup through `DatabaseService.onModuleDestroy()`.
- [x] README setup instructions corrected to describe database creation, schema loading, index creation, and seed data loading.
- [x] Environment configuration reviewed and accepted.

### Structured Backend Logging and Observability

Merged in PR #19.

- [x] Structured JSON backend logger.
- [x] Safe serialization, including circular-reference and BigInt handling.
- [x] Request-scoped context using `AsyncLocalStorage`.
- [x] Request ID middleware, including validation and generation of request IDs.
- [x] Request correlation and completion logging.
- [x] Global exception filter for unexpected server errors.
- [x] Runtime verification and automated unit/E2E tests.

### Calendar and AI Search Integration

Merged in PR #21.

- [x] Integrate calendar controls with natural-language event search.
- [x] Implement relative-date resolution and validation.
- [x] Reconcile explicit calendar filters with AI-inferred filters.
- [x] Require clarification when calendar and AI filters conflict.
- [x] Support Sunday-through-Saturday interpretation of "next week".
- [x] Add multi-select time-of-day filters.
- [x] Implement a bounded custom time picker.
- [x] Support toggleable 12-hour and 24-hour display formats.
- [x] Extract shared frontend/backend time-of-day definitions and intervals.
- [x] Polish calendar and search controls, including dark-mode visibility.

## 3. Planned Bonus Work

### README CI Badges

Status: Not started.

Add badges for:

- [ ] Database safety tests.
- [ ] PostgreSQL integration tests.
- [ ] End-to-end tests.

Requirements:
- Only add badges once the corresponding GitHub Actions workflows expose reliable status checks.
- Ensure badge links point to the correct workflows.
- Keep the README badges synchronized with actual CI configuration.

### AI Search Observability

Origin: Feedback from a friend during adversarial testing of the Gemini-powered event search feature.

Status: Not started / implementation requires inspection.

- [ ] Log incoming AI search requests.
- [ ] Capture Gemini's raw response.
- [ ] Log parsed and validated search filters.
- [ ] Record validation outcomes and parsing failures.
- [ ] Log Gemini API errors and relevant failure details.
- [ ] Record model latency and overall AI-search request duration.
- [ ] Correlate AI-search logs with the existing request ID.
- [ ] Ensure logs do not expose credentials, secrets, or unnecessary personal information.

Distinguish between:
- Successful model responses containing unusable or invalid output.
- Gemini API failures or timeouts.
- Successful validation followed by zero matching events.

Use the existing structured logging infrastructure rather than introducing a separate logging system.

## Planned Frontend Framework Migration — Angular

**Status:** Not started.

**Objective:** Reimplement the existing React frontend using Angular to explore an alternative frontend architecture while preserving the existing application's functionality.

### Branch Strategy

- [ ] Create `feature/angular-frontend` from the existing `main` branch.
- [ ] Preserve the existing React implementation on `main`.
- [ ] Develop the Angular frontend independently.
- [ ] Reuse the existing NestJS backend, PostgreSQL database, and Gemini API integration.
- [ ] Incorporate relevant backend changes from `main` as needed.

### Implementation Scope

- [ ] Initialize an Angular application using TypeScript.
- [ ] Reimplement existing React components as Angular components.
- [ ] Migrate routing and navigation.
- [ ] Reimplement state management using Angular signals and services.
- [ ] Adapt frontend API clients to Angular's HTTP infrastructure.
- [ ] Reimplement forms, validation, and user interactions.
- [ ] Reuse existing CSS and styling where practical.
- [ ] Port relevant frontend unit tests and add coverage for Angular-specific behavior.

### Definition of Done

- [ ] Angular production build succeeds.
- [ ] Existing major frontend features have Angular equivalents.
- [ ] Authentication and backend API integration work correctly.
- [ ] Event discovery and Gemini-powered natural-language search work.
- [ ] Calendar, date, and time filters behave consistently with React.
- [ ] Booking creation, confirmation, cancellation, and history work correctly.
- [ ] Frontend unit tests pass.
- [ ] Regression testing confirms functional parity with the React implementation.
- [ ] Verify that both frontend implementations can independently run against the same backend.

### Scope Constraints

- Do not rewrite the NestJS backend.
- Do not duplicate or independently modify backend business logic.
- Preserve existing database schemas and API contracts.
- Keep the React implementation intact.
- Adapt browser-based E2E tests if they depend on React-specific UI behavior; backend-only tests should remain unchanged.

## 4. AI Search Security Improvements

Origin: Prompt-injection testing by a friend.

- [ ] Add prompt-injection regression tests, including XML-formatted instructions and attempts to override the model's intended role.
- [ ] Review system instructions and clearly define the model's event-search responsibility.
- [ ] Review structured-output validation and reject unexpected properties, invalid types, and malformed filters.
- [ ] Verify that model output cannot trigger arbitrary SQL execution.
- [ ] Verify that Gemini has no unnecessary access to database credentials, schema information, or privileged database operations.
- [ ] Confirm that database authorization and parameterized queries remain enforced independently of model output.

Security principle: Prompt instructions are not a security boundary. Backend validation and database authorization must prevent unauthorized operations even when the model produces malicious or unexpected output.

## 5. Deferred Repository Cleanup

### Prisma Scaffolding Audit

Status: Deferred; not required for reliability.

Original finding:
- No application code currently uses Prisma.
- No Prisma migration files were identified.
- Prisma appears to be unused scaffolding.

Possible future actions:
- [ ] Inspect Prisma dependencies, configuration, generated files, and the `prisma/` directory.
- [ ] Determine whether any scripts or developer workflows depend on Prisma.
- [ ] Decide whether to remove unused scaffolding and dependencies.

Do not remove Prisma as part of reliability work without first checking for hidden dependencies.

### General Repository Polish

Status: No additional approved tasks currently recorded.

Only add concrete, justified cleanup tasks here.
Avoid using this section as an open-ended invitation to refactor working code.

## 6. Future Ideas

### AI Search Analytics Dashboard

Status: Optional future idea; not committed work.

Potential metrics:
- AI-search request volume.
- Successful and failed interpretation rates.
- Commonly misunderstood queries.
- Gemini response latency.
- Search result counts.
- Prompt-injection test outcomes.

Consider only after the underlying logging and data-retention requirements are established.


## 7. Technical Decisions and Constraints

### Environment Configuration

Decision: No change required.

- NestJS `ConfigModule.forRoot()` loads the root `.env` using the documented backend startup command.
- `.env` is ignored by Git.
- Keep secrets out of source control and example configuration files.

### Prisma

Decision: Deferred.

- Its apparent lack of use is not a reliability defect.
- Removal is optional repository cleanup, not a Phase 5 requirement.

### Scope Management

- Keep reliability-critical work separate from optional enhancements.
- Prefer small, independently reviewable pull requests.
- Avoid broad refactors without a concrete benefit.
- Update this roadmap when a planned item is implemented or a decision changes.

## AI Search Implementation Audit — November 8, 2026

This audit records the existing implementation and remaining work for
natural-language event search. It is based on inspection of the backend
implementation and related tests.

### Existing Implementation

- [x] Supply the current Toronto date to the Gemini interpreter.
- [x] Include the explicit `America/Toronto` timezone in the interpreter prompt.
- [x] Request structured JSON output using Gemini response schemas.
- [x] Parse Gemini JSON responses and validate the resulting search plan.
- [x] Reject unsupported search-plan fields.
- [x] Validate optional intent length and date ranges.
- [x] Configure Gemini requests with a 20-second timeout.
- [x] Configure Gemini requests with two retry attempts.
- [x] Normalize Gemini abort, HTTP 503, and HTTP 504 failures into a controlled service-unavailable response.
- [x] Treat candidate event data as untrusted data in the ranking prompt.

### Remaining Work

#### Relative-Date Interpretation

- [ ] Verify that Gemini correctly interprets representative relative-date queries, including "this weekend".
- [ ] Test date boundaries independently of mocked Gemini responses.
- [ ] Add timezone-boundary and daylight-saving-time regression tests.
- [ ] Verify that interpreted date filters are correct when passed into event candidate searches.

Existing tests verify that the current date and timezone appear in the prompt, and that mocked date filters are parsed and returned. They do not establish the accuracy of Gemini's actual date interpretation.

#### Provider Error Handling

- [ ] Map missing API-key configuration to an appropriate, actionable client-facing HTTP response.
- [ ] Normalize other upstream Gemini failures into appropriate HTTP responses.
- [ ] Preserve useful server-side diagnostics without exposing internal provider details to clients.
- [ ] Add regression tests for additional provider failures and client-facing responses.
- [ ] Distinguish invalid model output, provider failures, timeouts, and successful searches with no results.

Currently, abort errors and provider status codes 503 and 504 are handled. Other errors propagate unchanged. Missing API-key errors are currently thrown as generic errors by the interpreter and ranker.

#### Rate Limiting

- [ ] Add rate limiting to `POST /events/natural-language-search`.
- [ ] Return an appropriate HTTP response when the limit is exceeded.
- [ ] Add tests for rate-limit behavior.

No rate-limiting implementation was found in the inspected backend source or backend package manifest.

#### AI Search Observability

- [ ] Log natural-language search requests with request correlation IDs.
- [ ] Record Gemini interpreter and ranker failures.
- [ ] Record parsed search plans and validation outcomes.
- [ ] Capture useful provider diagnostics and request latency.
- [ ] Distinguish invalid model output, provider failures, timeouts, and successful searches returning no results.
- [ ] Establish appropriate privacy controls before logging raw user queries or Gemini responses.

Use the structured logging infrastructure introduced in PR #19. AI-specific logging is not established merely by the existence of the global logger and exception filter.

#### Prompt-Injection and Output-Security Testing

- [ ] Add regression tests for prompt-injection attempts embedded in natural-language queries.
- [ ] Test attempts to override system instructions or request database schema, credentials, or internal information.
- [ ] Test malformed and unsupported Gemini responses.
- [ ] Verify that structured output validation rejects unsupported fields and invalid date filters.
- [ ] Verify that candidate event data cannot override ranking instructions.
- [ ] Confirm that database access remains restricted to backend-controlled, validated queries.

The ranking prompt already describes candidate event data as untrusted input. However, no dedicated prompt-injection regression tests were found in the inspected AI and search test directories.

### Audit Scope and References

Implementation inspected:

- `4. backend/src/search/natural-language-search.service.ts`
- `4. backend/src/events/search/gemini-event-search-interpreter.ts`
- `4. backend/src/events/search/gemini-event-ranker.ts`
- `4. backend/src/events/search/ParseNaturalLanguageSearchInterpreterHelpers.ts`
- `4. backend/src/search/natural-language-search.ts`
- `4. backend/src/ai/gemini/gemini-client-config.ts`
- `4. backend/src/events/events.controller.ts`
- `4. backend/src/events/events.module.ts`

Tests inspected:

- `0. tests/backend/ai/geminiSearchInterpreter.test.ts`
- `0. tests/backend/ai/geminiSearchInterpreterErrors.test.ts`
- `0. tests/backend/ai/geminiEventRanker.test.ts`
- `0. tests/backend/search/naturalLanguageSearchFailures.test.ts`
- `0. tests/backend/search/validateNaturalLanguageSearchPlan.test.ts`
- `0. tests/backend/events/search/searchEventsController.test.ts`

---

Last updated: November 8, 2026
