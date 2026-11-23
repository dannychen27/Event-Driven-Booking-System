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

### Immediate Booking Status on Event Cards

#### Booking Status Behavior

- [x] Fetch booking history once when loading the Events page.
- [x] Maintain existing booking status across event cards without individual API requests.
- [x] Immediately reflect successful bookings in the Events page.
- [x] Disable booking when booking history cannot be reliably retrieved.
- [x] Preserve backend duplicate-booking protection.
- [x] Add frontend regression tests for immediate booking status.

#### EventCard Presentation

- [x] Replace the disabled "Already booked" button with a green booking-status badge.
- [x] Display the confirmation message: "You've already booked this event."
- [x] Improve the badge and confirmation styling in light mode.
- [x] Add consistent green styling and contrast in dark mode.
- [x] Add regression assertions for the booked-state presentation.
- [x] Verify the appearance manually:
    - [x] Light mode: badge and confirmation message are clearly visible.
    - [x] Light mode: badge and event title do not overlap.
    - [x] Dark mode: badge has a darker green background and readable text.
    - [x] Dark mode: confirmation message and checkmark have sufficient contrast.
    - [x] Both themes: normal booking state remains visually correct.
    - [x] Verify loading and error booking states through existing automated tests.

#### Network and API Verification

- [x] Open Chrome DevTools Network tab and reload the Events page.
- [x] Verify the events API request succeeds.
- [x] Verify the booking-history API request succeeds.
- [x] Inspect the events response and confirm Event ID 1 is present.
- [x] Inspect the booking-history response and confirm Event ID 1 is recorded as booked.
- [x] Confirm no other events are rendered in the Events page.
- [x] Confirm booking history is fetched at the page level rather than once per event card (accounting for React Strict Mode in development).
- [x] Confirm no unnecessary per-event booking-status requests are made.

#### Optional Manual QA

- [ ] Verify the loading state using network throttling.
- [x] Verify the booking-history error state and retry request.

#### Follow-up: API-Unavailable State Verification

**Status:** Partially completed — booking-history endpoint failure and recovery verified.

- [x] Simulate booking-history API unavailability using Chrome DevTools Network Request Blocking.
- [ ] Observe and verify the loading-to-error transition on the Events page.
- [x] Verify the booking-history failure message is displayed correctly.
- [x] Verify the retry behavior after booking-history API access is restored.
- [x] Confirm the Events page recovers successfully after restoring booking-history API access.

**Scope:** The manual verification above covers booking-history endpoint failure and recovery. A broader backend-outage and loading-transition test remains outstanding.

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

### Prisma Scaffolding Cleanup

Status: Completed.

Findings:
- No application code or developer workflows depended on Prisma.
- No Prisma migrations or generated client artifacts were present.
- Database access is implemented using PostgreSQL `pg` and direct SQL.

Completed actions:
- [x] Remove `prisma` and `@prisma/client` dependencies.
- [x] Delete `prisma.config.ts` and the `prisma/` directory.
- [x] Remove the obsolete local `DATABASE_URL` configuration.
- [x] Remove Prisma references from the README project structure.

### General Repository Polish

#### CSS Maintainability and Cascade Cleanup

Status: Not started.

- [ ] Audit existing CSS usage of `!important`.
- [ ] Identify declarations that unnecessarily override the normal CSS cascade.
- [ ] Replace unnecessary uses with appropriately scoped selectors, component styles, or theme-specific rules.
- [ ] Retain `!important` only where there is a documented justification, such as overriding third-party styles.
- [ ] Establish consistent conventions for CSS specificity and dark-mode overrides.
- [ ] Verify that visual behavior remains unchanged after cleanup.

Only add concrete, justified cleanup tasks here.
Avoid using this section as an open-ended invitation to refactor working code.

## 6. Future Ideas

### Sticky Navigation Bar

Improve navigation accessibility while scrolling through longer pages.

- [ ] Make the navbar stick to the top of the viewport when scrolling.
- [ ] Ensure the navbar remains above page content without obscuring it.
- [ ] Preserve the existing navbar appearance in light and dark modes.
- [ ] Verify sticky behavior across desktop and mobile screen sizes.
- [ ] Confirm the navbar does not interfere with page scrolling or responsive layouts.

### Reusable Loading States

Status: Completed.

- [x] Create a reusable `LoadingState` component.
- [x] Add a centered animated spinner and optional supporting descriptions.
- [x] Add accessible loading semantics (`role="status"`, `aria-live`, and `aria-busy`).
- [x] Hide the decorative spinner from assistive technology.
- [x] Support light and dark themes.
- [x] Respect reduced-motion preferences.
- [x] Integrate full-page loading states into `EventsPage`, `VenuesPage`, and `BookingsPage`.
- [x] Preserve the independent booking-history loading indicator on `EventsPage`.
- [x] Add component and page regression tests.
- [x] Verify spinner animation manually in light and dark modes.
- [x] Pass the full frontend test suite (214/214 tests across 32 files).
- [x] Pass the frontend production build.
- [x] Re-run the three page regression suites after removing temporary loading-preview overrides (24/24 tests).
- [x] Pass `git diff --check`.

### Portfolio-Ready Card Content and Presentation

Status: In Progress.

**Goal:** Make the EventCard, VenueCard, and booking history cards
feel like components of a polished, user-facing event-booking product,
rather than developer-oriented data displays.

#### EventCard

- [x] Replace raw event identifiers and developer-oriented labels with meaningful event information.
- [x] Present event names, venue names, dates, times, and locations clearly.
- [ ] Display relevant pricing, capacity, and availability information where appropriate.
- [x] Ensure optional or missing event information has sensible user-facing fallbacks.

#### VenueCard

- [x] Replace raw venue identifiers and technical labels with meaningful venue information.
- [x] Present venue names, readable addresses, and useful descriptions.
- [ ] Display relevant capacity and venue details where available.
- [x] Add optional venue image URLs to the database schema, backend response, and frontend Venue type.
- [x] Populate realistic venue images in the showcase seed data.
- [x] Display venue images consistently with EventCard's image presentation.
- [x] Provide an accessible fallback for missing or broken venue images.
- [x] Add regression tests for venue image rendering and fallback behavior.
- [x] Ensure missing optional information does not produce awkward or empty labels.

#### Booking History Cards

- [x] Show the booked event name and associated venue instead of relying on event identifiers.
- [x] Present event dates and booking timestamps using readable, consistent formatting.
- [x] Make available booking actions and their states clear to users.
- [x] Handle missing or unavailable event and venue information gracefully.

#### Venue-to-Events Navigation

- [x] Link each venue card to the events hosted at that venue.
- [x] Support filtering the Events page by the selected venue.
- [x] Show the selected venue context and provide a way to return to all events.
- [x] Handle venues with no matching upcoming events gracefully.
- [x] Add regression tests for venue-to-events navigation and filtering.

#### Consistency and Regression Verification

- [ ] Standardize date, time, status, and metadata presentation across all three card types.
- [x] Remove unexplained internal identifiers, raw enum values, and implementation-specific labels from user-facing displays.
- [x] Preserve existing booking, cancellation, and navigation behavior.
- [ ] Verify desktop and mobile layouts.
- [ ] Verify light and dark themes.
- [x] Add or update regression tests for the revised card content.
- [ ] Verify that realistic demo data supports portfolio screenshots of the Venues and Booking History pages.

#### Portfolio Screenshot Readiness

- [ ] Confirm all three card types display realistic, human-readable information.
- [ ] Confirm the Venues and Booking History pages have representative data and polished empty/loading/error states.
- [ ] Capture final portfolio screenshots of the Venues and Booking History pages.

### Skeleton Loading UI

Status: Completed.

**Goal:** Replace generic full-page loading indicators with content-shaped placeholders that preview the actual page layouts.

#### Reusable Skeleton Components

- [x] Inspect the existing event, venue, and booking card components.
- [x] Create a reusable `Skeleton` primitive.
- [x] Support configurable dimensions and shapes.
- [x] Add a subtle loading animation.
- [x] Support light and dark themes.
- [x] Respect reduced-motion preferences.

#### Page-Specific Skeleton Layouts

- [x] Create an `EventCardSkeleton` matching the actual event-card layout.
- [x] Create a `VenueCardSkeleton` matching the actual venue-card layout.
- [x] Create a `BookingCardSkeleton` matching the actual booking-card layout.
- [x] Integrate event skeletons into `EventsPage`.
- [x] Integrate venue skeletons into `VenuesPage`.
- [x] Integrate booking skeletons into `BookingsPage`.
- [x] Keep skeleton dimensions consistent with loaded content to minimize layout shifts.
- [x] Verify responsive layouts at narrow mobile widths.

#### Regression Testing

- [x] Add component tests for the reusable `Skeleton` primitive.
- [x] Add tests for each page-specific skeleton component.
- [x] Verify each page renders its skeleton while data is loading.
- [x] Verify actual content replaces skeletons after successful retrieval.
- [x] Verify existing error and empty states remain unaffected.
- [x] Run the full frontend test suite and production build.

### Reusable Error States and Offline Experience

**Status: In Progress**

**Objective:** Provide consistent, user-friendly error states across the frontend, with actionable recovery options when API requests fail or connectivity is interrupted.

**Completed**
- [x] Build a reusable `ErrorState` component.
- [x] Support configurable headings, descriptions, illustrations, and retry actions.
- [x] Support a playful default variant and an optional professional variant.
- [x] Add light- and dark-theme styling.
- [x] Integrate reusable full-page error states into `EventsPage`.
- [x] Integrate reusable full-page error states into `VenuesPage`.
- [x] Integrate the reusable error state into `BookingsPage` (`My Bookings`).
- [x] Support structured troubleshooting guidance using paragraphs and bullet lists.
- [x] Add frontend regression tests for `ErrorState`, `EventsPage`, and `VenuesPage`.
- [x] Add regression tests for retry success, retry failure, and recovery behaviour.
- [x] Preserve independent compact error handling for booking-history status on `EventsPage`.

**Remaining**
- [ ] Replace remaining technical or implementation-specific error messages with user-friendly guidance where appropriate.
- [ ] Verify retry and recovery after API connectivity is restored.
- [ ] Verify loading-to-error transitions and successful recovery across all relevant pages.

### Four Seasons Theme 🌸☀️🍂❄️

Status: Planned.

- [ ] Introduce four seasonal visual themes: Spring, Summer, Autumn, and Winter.
- [ ] Give each season its own coordinated colour palette and visual accents.
- [ ] Ensure all four themes support light and dark modes.
- [ ] Preserve readability, accessibility, and sufficient colour contrast.
- [ ] Apply seasonal styling consistently across navigation, pages, cards, and shared components.
- [ ] Explore subtle seasonal illustrations and decorative details.
- [ ] Verify responsive layouts across desktop and mobile.

### Accessibility Improvements

Status: Planned.

- [ ] Audit the application for accessibility issues across all pages and shared components.
- [ ] Ensure interactive elements are keyboard accessible and have clear focus indicators.
- [ ] Provide appropriate accessible names, labels, and roles for controls and status messages.
- [ ] Verify sufficient colour contrast in both light and dark themes.
- [ ] Support screen readers with meaningful headings, landmarks, and announcements.
- [ ] Review forms, validation messages, loading states, and error states for accessibility.
- [ ] Test responsive layouts and usability at different zoom levels.
- [ ] Add accessibility checks to the frontend testing workflow where practical.

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

### Database Access

Decision: Use PostgreSQL through `pg` and direct SQL.

- Database access is implemented using the `pg` connection pool and parameterized SQL queries.
- Database transactions and row-level locking enforce booking consistency.
- Prisma ORM is not used.
- Avoid introducing an ORM without a concrete architectural need.

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

Last updated: November 22, 2026

## Deferred: Full Visual QA and Portfolio Polish

**Status:** Deferred — current card presentation is acceptable. Revisit this work when time is available, before capturing final portfolio screenshots.

### Card Visual QA

- [ ] EventCard: verify responsive layout across desktop, laptop, tablet, and mobile viewports.
- [ ] VenueCard: verify responsive layout across desktop, laptop, tablet, and mobile viewports.
- [ ] BookingCard: verify responsive layout across desktop, laptop, tablet, and mobile viewports.
- [ ] Verify all three card types in light and dark themes.
- [ ] Verify image fallbacks and loading skeletons in both themes.
- [ ] Check long text, spacing, alignment, and horizontal overflow.

### Page-Level Visual QA

- [ ] Review Events page loading, empty, error, and populated states.
- [ ] Review Venues page loading, empty, error, and populated states.
- [ ] Review Booking History page loading, empty, error, and populated states.
- [ ] Check page layouts across desktop, laptop, tablet, and mobile viewports.
- [ ] Check navigation and interactions across the three pages.

### Responsive Viewport Coverage

Use these representative viewport widths for card and page-level QA:

- [ ] Desktop: 1920px and 1440px.
- [ ] Laptop: 1366px and 1280px.
- [ ] Tablet landscape: 1024px.
- [ ] Tablet portrait: 768px.
- [ ] Mobile: 430px, 390px, 375px, and 320px.
- [ ] Check intermediate widths around CSS breakpoints and layout transitions.
- [ ] Verify no horizontal overflow, clipped content, or awkward text wrapping.

### Portfolio Screenshot Readiness

- [ ] Capture final desktop screenshots of Events, Venues, and Booking History.
- [ ] Capture representative mobile screenshots.
- [ ] Address any visual issues discovered during the deferred QA pass.
---

## Interaction and UI Polish

**Status:** In Progress — venue-to-events navigation, booking button styling, and booking-history error-state polish are implemented; remaining data-management and usability tasks are listed below.

### Booking Button Styling

- [x] Improve the visual styling of the green Create Booking button.
- [x] Improve the visual styling of the red Cancel Booking button.
- [x] Standardize button dimensions, typography, border radius, hover states, and focus states.
- [x] Preserve the semantic distinction between primary booking and destructive cancellation actions.
- [x] Preserve existing booking and cancellation behavior and regression coverage.

### Booking-History Failure Handling and Error-State Polish

**Status:** Completed.

**Goal:** Ensure EventCard safely handles unavailable booking-history data, communicates the problem clearly, and allows users to recover without disrupting event discovery.

#### Manual QA: Failure and Recovery

- [x] Inspect the booking-history API request and EventCard error-state handling.
- [x] Use Chrome DevTools Network Request Blocking to simulate a failed booking-history API response.
- [x] Reload the Events page and verify that unbooked events display the disabled "Booking status unavailable" button.
- [x] Verify that the fallback does not allow a booking while booking status is unknown.
- [x] Restore normal API behaviour and retry booking history.
- [x] Verify that the regular booking button or already-booked state returns as appropriate.
- [x] Record the reproduction and recovery steps for future manual regression testing.

**Reproduction and recovery procedure:**

1. Open Chrome DevTools and navigate to Network Request Blocking.
2. Block `http://localhost:3000/users/1/bookings`.
3. Reload the Events page.
4. Verify the booking-history error state and disabled booking buttons.
5. Attempt to interact with a disabled booking button and confirm no booking can be initiated.
6. Remove the blocking rule and retry booking status.
7. Verify normal booking states return.

#### Error-State Presentation and Regression Testing

- [x] Display the booking-history error explanation and retry instruction as separate paragraphs.
- [x] Replace the generic error illustration with a contextual CalendarX icon.
- [x] Verify the updated error presentation in the browser.
- [x] Preserve independent booking-history retry behaviour.
- [x] Pass the EventsPage regression tests (11/11).
- [x] Pass the frontend production build.
- [x] Pass `git diff --check`.

### Development and Showcase Venue Data Separation

**Status:** In Progress — isolated showcase database creation, booking seed, idempotency, and development-data preservation verified; UI checks remain.

**Goal:** Keep development edge-case venues available for testing while presenting a clean, intentional set of canonical venues in the portfolio showcase data.

- [x] Inspect the duplicate Bahen venue records and identify their associated events and bookings.
- [x] Identify one canonical Bahen venue record for the showcase dataset (ID 6).
- [x] Confirm the additional Bahen development fixtures (IDs 1 and 3) are already preserved in `seed data/seed.sql`.
- [x] Preserve duplicate-name development fixtures in development seed data (IDs 1 and 3).
- [x] Keep showcase seed data focused on realistic, intentional venues.
- [x] Review foreign-key relationships and seed execution order before changing venue records.
- [x] Create the isolated showcase database using the create-only setup script.
- [x] Verify the showcase database contains four venues, eight events, one demo user, and four confirmed bookings, with zero booking holds.
- [x] Verify no development-only Moss Park Espresso venue or Meet and Greet event appears in the showcase database.
- [x] Verify the showcase booking seed can be rerun without creating duplicate bookings.
- [x] Confirm the original Alice and Bob development bookings remain intact in `booking_system`.
- [x] Pass the database setup safety suite (49 tests).
- [ ] Verify existing database migration/update behavior.
- [ ] Confirm the Events and Venues pages display the intended showcase data.
- [ ] Verify that development seed scripts still provide the intended edge-case coverage.

**Scope constraints:**
- Do not delete useful development records merely to remove duplicate-looking showcase entries.
- Do not change venue IDs or relationships without checking dependent events and bookings.
- Keep development fixtures and portfolio showcase data clearly separated.

### Search and Filter Usability

- [ ] Explore a collapsible search bar on the Events page.
- [ ] Add collapsible date and time filter controls.
- [ ] Preserve active search queries and filter selections when controls are collapsed or expanded.
- [ ] Ensure collapsed controls remain accessible and communicate their expanded/collapsed state.

### Collapsible Card Evaluation

- [ ] Evaluate whether EventCards benefit from collapsible descriptions or secondary details.
- [ ] Evaluate whether VenueCards benefit from collapsible descriptions or secondary details.
- [ ] Evaluate whether BookingCards benefit from collapsible content.
- [ ] Implement collapsible card content only where it meaningfully improves usability.
- [ ] Keep important information and primary actions accessible.
- [ ] Add regression tests for any implemented collapse/expand interactions.

---

## Future Enhancements

### 1. Compact Loading Indicators

**Status:** Completed.

**Goal:** Reduce the vertical space occupied by loading messages so users can see more of the skeleton-card animations.

- [x] Replace large loading messages with a compact horizontal loading indicator.
- [x] Add a small animated spinner beside the message.
- [x] Use consistent loading messages: "Loading events...", "Loading venues...", and "Loading bookings...".
- [x] Keep existing skeleton-card animations visible underneath the indicator.
- [x] Standardize indicator alignment, spacing, and typography across all three pages.
- [x] Provide accessible loading announcements for screen readers.
- [x] Preserve existing loading, error, and empty-state behaviour.
- [x] Add or update regression tests for loading indicators and skeleton visibility.

#### Verification

- [x] Verify the loading indicator visually on desktop and mobile, including a 320px viewport.
- [x] Pass the full frontend test suite (33 test files, 221 tests).
- [x] Pass the frontend production build.
- [x] Pass `git diff --check`.


### 2. Custom Timezone Selector

**Goal:** Let users view event and booking times in their preferred timezone, independently of the event's original timezone.

- [ ] Detect the user's browser timezone as the initial default.
- [ ] Add a manually configurable timezone selector using IANA timezone identifiers.
- [ ] Display event start and end times in the selected timezone.
- [ ] Apply the selected timezone consistently across Events, Venues, Booking History, and booking confirmation interfaces.
- [ ] Handle daylight-saving transitions correctly.
- [ ] Persist the user's timezone preference across sessions.
- [ ] Clearly identify the timezone used when displaying event times.
- [ ] Preserve timezone-independent event timestamps and existing booking semantics.
- [ ] Add regression tests for timezone conversion, daylight-saving transitions, and preference persistence.

### 3. AI-Assisted Localization

**Goal:** Let users choose an application language and access translated interface and event content.

#### Application Internationalization

- [ ] Introduce an internationalization framework for static UI strings.
- [ ] Add a language selector.
- [ ] Translate navigation, buttons, labels, forms, and status messages.
- [ ] Translate error messages, empty states, and loading-state text.
- [ ] Persist the user's language preference across sessions.
- [ ] Provide a sensible fallback when a translation is unavailable.

#### AI-Assisted Dynamic Content Translation

- [ ] Evaluate Gemini API integration for translating dynamic event and venue descriptions.
- [ ] Support translation of AI-generated event-search results and clarification messages.
- [ ] Preserve the original content and allow users to switch back to it.
- [ ] Handle translation failures and API timeouts without breaking normal application functionality.
- [ ] Avoid translating fixed UI strings dynamically through AI.
- [ ] Add regression tests for translation success, failure, and fallback behaviour.

#### Quality and Accessibility

- [ ] Verify translated text does not cause layout overflow or clipping.
- [ ] Review date, time, number, and locale-specific formatting.
- [ ] Validate translation consistency and terminology across the application.
