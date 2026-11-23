# Event-Driven Booking System — Project Roadmap

This document is the source of truth for project milestones, planned improvements, deferred work, and important technical decisions.

Update it when significant work is completed, merged, approved, or deliberately deferred.

## 1. Roadmap Overview

### 1.1 Current Milestone: Portfolio Showcase Readiness

Focus on completing the user-facing experience and preparing a convincing, reliable demonstration of the booking system.

### 1.2 Next Milestones

1. [ ] Complete meaningful EventCard, VenueCard, and BookingCard content and presentation.
2. [ ] Verify showcase data and demonstrate the end-to-end booking workflow.
3. [ ] Deploy the application and verify production readiness.
4. [ ] Complete post-deployment responsive, theme, and page-state QA.
5. [ ] Finalize portfolio screenshots and README presentation.

---

## 2. Active Milestones

### 2.1 Portfolio-Ready Card Content and Presentation

**Status:** In Progress

Complete the information and presentation of event, venue, and booking cards so users can understand important details without needing to open a separate detail page. Ensure card layouts adapt appropriately to different screen sizes.

#### EventCard

- [x] Display event title and description.
- [x] Display event date and time.
- [x] Display venue information.
- [x] Display confirmed attendee counts.
- [x] Display booking status where applicable.
- [x] Improve content hierarchy and readability.
- [x] Handle missing or optional event information.
- [x] Ensure card content remains useful across different event types.

#### VenueCard

- [x] Display venue name and description.
- [x] Display venue images with appropriate fallbacks.
- [x] Display venue address.
- [x] Improve the presentation of venue metadata.
- [ ] Review whether additional details should be displayed.
- [x] Ensure venue information is consistent with the venue detail and event views.

#### Booking History Cards

- [x] Display event and venue information.
- [x] Display booking date and relevant booking details.
- [x] Distinguish confirmed and cancelled bookings.
- [x] Handle missing event or venue information.
- [x] Improve card readability and information hierarchy.

#### Venue-to-Events Navigation

- [x] Allow users to navigate from a venue to its associated events.
- [x] Ensure navigation uses the correct venue identifier.
- [x] Handle venues without associated events.
- [x] Verify navigation behavior.

#### Responsive Card Design

- [ ] Ensure EventCard, VenueCard, and BookingCard adapt to different screen sizes.
- [ ] Adjust card layouts, spacing, and content hierarchy for smaller viewports.
- [ ] Prevent text overflow, cramped layouts, and unnecessary horizontal scrolling.
- [ ] Ensure card images and actions scale appropriately across viewport sizes.
- [ ] Maintain consistent presentation across light and dark themes.

#### Content Consistency

- [ ] Review date, time, status, and metadata consistency across all card types.
- [x] Remove unnecessary technical labels from user-facing content.
- [x] Add regression coverage for card content and presentation.

### 2.2 Showcase Data and Booking Workflow Verification

**Status:** In Progress

Prepare a clean, representative dataset for the portfolio demonstration while preserving useful development fixtures and edge cases.

#### Showcase Database

- [x] Inspect duplicate Bahen Centre records and their associated events and bookings.
- [x] Identify canonical Bahen Centre venue ID `6`.
- [x] Preserve existing development fixtures, including venue IDs `1` and `3`, in `seed data/seed.sql`.
- [x] Keep duplicate development records available for testing rather than deleting useful fixtures.
- [x] Create a focused showcase seed separate from the general development seed.
- [x] Inspect foreign-key relationships and seed ordering.
- [x] Create an isolated, create-only showcase database initialization script.
- [x] Verify the showcase database contains:
  - [x] 4 venues.
  - [x] 8 events.
  - [x] 1 demo user.
  - [x] 4 confirmed bookings.
  - [x] 0 active booking holds.
- [x] Verify development-only records such as Moss Park Espresso and Meet and Greet are absent from the showcase database.
- [x] Verify repeated showcase seeding is idempotent.
- [x] Confirm Alice and Bob's development bookings remain intact in `booking_system`.
- [x] Run the database safety test suite successfully (49 tests).

#### Remaining Data Verification

- [ ] Verify migration and update behavior against the showcase database.
- [ ] Verify the Venues page displays the intended showcase data.
- [ ] Verify the Booking History page displays the intended demo bookings.
- [ ] Confirm development seed fixtures still cover useful edge cases.
- [ ] Review data consistency across Events, Venues, and Booking History.
- [ ] Ensure the dataset supports a realistic end-to-end booking demonstration.

#### End-to-End Demonstration

- [ ] Demonstrate browsing events and venues.
- [ ] Demonstrate searching and filtering events.
- [ ] Demonstrate creating and confirming a booking.
- [ ] Demonstrate cancellation and the resulting booking status.
- [ ] Verify booking history reflects the expected changes.
- [ ] Resolve any issues discovered during the demonstration.

#### Data Safety Constraints

- Preserve useful development records and edge-case fixtures.
- Do not change venue IDs or relationships without checking dependent records.
- Keep development fixtures and portfolio showcase data separate.
- Do not use destructive database initialization or reset behavior for showcase setup.

### 2.3 Deployment and Production Readiness

**Status:** Not Started

Deploy the application so that recruiters and other viewers can access a working demonstration without running the project locally.

#### Deployment Planning

- [ ] Evaluate hosting options for the React frontend, NestJS backend, and PostgreSQL database.
- [ ] Select hosting based on cost, reliability, and operational simplicity.
- [ ] Identify required production environment variables.
- [ ] Configure frontend API URLs and backend CORS settings.
- [ ] Document the production architecture and configuration.

#### Backend and Database Deployment

- [ ] Deploy the NestJS backend.
- [ ] Provision and configure PostgreSQL.
- [ ] Configure secure database connections and connection pooling.
- [ ] Apply the database schema and migrations without destroying existing data.
- [ ] Initialize intentional showcase data.
- [ ] Confirm structured logging and request IDs work in production.

#### Frontend Deployment

- [ ] Build and deploy the React frontend.
- [ ] Configure the production backend URL.
- [ ] Verify client-side routing and direct page refreshes.
- [ ] Verify HTTPS.
- [ ] Ensure secrets and privileged configuration are never exposed to the frontend.

#### Production Verification

- [ ] Verify Events, Venues, and Booking History pages.
- [ ] Verify keyword search and Gemini-powered natural-language search.
- [ ] Verify booking creation, confirmation, cancellation, and history.
- [ ] Verify backend validation and concurrency-sensitive booking behavior.
- [ ] Verify loading, empty, and error states.
- [ ] Verify behavior when the Gemini API key is missing or the provider is unavailable.
- [ ] Verify existing showcase data and bookings persist across backend restarts and redeployments.
- [ ] Verify responsive layouts and light/dark themes.
- [ ] Inspect browser console output and backend logs.
- [ ] Confirm the application works without local development dependencies.
- [ ] Add the public application URL and deployment instructions to the README.

#### Deployment Constraints

- Never commit secrets or production credentials.
- Never expose database credentials or privileged backend configuration to the frontend.
- Do not use destructive database initialization or reset scripts in production.
- Preserve existing database safety protections.
- Keep deployment reproducible and document the required configuration.
- Avoid introducing infrastructure solely to add résumé keywords.

### 2.4 Final Portfolio Presentation

**Status:** Not Started

Prepare the project for external review and ensure the README and screenshots communicate the implemented functionality accurately.

#### Screenshots

- [ ] Capture polished desktop screenshots of the Events page.
- [ ] Capture polished desktop screenshots of the Venues page.
- [ ] Capture polished desktop screenshots of Booking History.
- [ ] Capture representative mobile screenshots.
- [ ] Use the deployed application for final screenshots once deployment is complete.
- [ ] Ensure screenshots show representative showcase data and meaningful application states.

#### README Presentation

- [ ] Verify the README accurately describes implemented functionality.
- [ ] Ensure architecture and technology descriptions do not imply unimplemented features.
- [ ] Include the deployed application URL once available.
- [ ] Include clear setup and deployment instructions.
- [ ] Present screenshots of the strongest implemented features.
- [ ] Ensure the README and roadmap agree on project status.

---

## 3. Planned Improvements

These improvements are useful follow-up work but are not prerequisites for completing the current portfolio showcase milestone unless explicitly moved into an active milestone.

### 3.1 README CI Badges

**Status:** Not Started

- [ ] Add a badge for the main CI test workflow.
- [ ] Add a badge for database safety tests.
- [ ] Add a badge for PostgreSQL integration tests.
- [ ] Add a badge for end-to-end tests.
- [ ] Verify each badge points to the correct workflow.
- [ ] Only add badges for reliable workflows that are actively maintained.
- [ ] Keep badge status and README documentation synchronized with CI.

### 3.2 AI Search Correctness and Provider Error Handling

**Status:** Not Started

Improve the reliability of Gemini-powered natural-language event search.

- [ ] Test Gemini's interpretation of relative dates against actual provider responses.
- [ ] Verify expressions such as "this weekend" and other common relative-date phrases.
- [ ] Test date boundaries and timezone-sensitive interpretation.
- [ ] Verify behavior around daylight-saving transitions.
- [ ] Add regression tests for relative-date interpretation.
- [ ] Review missing API-key behavior and provide an actionable client-facing response.
- [ ] Normalize unexpected provider errors into controlled application errors.
- [ ] Preserve useful diagnostic information for debugging.
- [ ] Distinguish invalid model output, provider failures, timeouts, and valid searches with zero results.
- [ ] Add tests for the resulting error-handling behavior.

### 3.3 AI Search Observability

**Status:** Not Started

Extend existing structured backend logging to provide useful diagnostics for natural-language search without exposing sensitive information.

- [ ] Log incoming natural-language search requests.
- [ ] Capture Gemini's raw response where safe and appropriate.
- [ ] Log parsed and validated search filters.
- [ ] Record validation outcomes and parsing failures.
- [ ] Record provider errors and timeout events.
- [ ] Measure model latency and overall request duration.
- [ ] Correlate AI search logs using the existing request ID.
- [ ] Avoid logging sensitive user information or unnecessary raw data.
- [ ] Distinguish invalid model output, provider failures, timeouts, and successful searches returning zero results.
- [ ] Reuse the existing structured logger rather than introducing a separate logging system.

### 3.4 AI Search Security Improvements

**Status:** Not Started

Review the natural-language search pipeline for prompt-injection and malformed-output risks.

- [ ] Add prompt-injection tests using XML-formatted input and instruction-override attempts.
- [ ] Review system instructions and ensure the model's role and scope are explicit.
- [ ] Validate structured model output and reject unexpected properties.
- [ ] Reject malformed values and unsupported filter types.
- [ ] Ensure model output cannot introduce arbitrary SQL or bypass backend validation.
- [ ] Ensure Gemini does not receive unnecessary database credentials, schema details, or privileged operational capabilities.
- [ ] Verify database access remains restricted to backend-controlled, validated queries.
- [ ] Treat prompt instructions as guidance, not as a security boundary.

### 3.5 AI Search Rate Limiting

**Status:** Not Started

- [ ] Review abuse and resource-exhaustion risks for `POST /events/natural-language-search`.
- [ ] Implement an appropriate rate limit for natural-language search requests.
- [ ] Return a suitable HTTP response when the limit is exceeded.
- [ ] Add tests for requests within and beyond the configured limit.
- [ ] Ensure rate limiting does not interfere with ordinary keyword or calendar-based search.

---

## 4. Follow-up Work and Deferred Ideas

These ideas are generally deferred until the core application and portfolio demonstration are complete. Section 4.1 is an active quality-assurance workstream supporting portfolio readiness. Other items should be revisited as priorities allow.

### 4.1 Portfolio Quality Assurance

**Status:** In Progress

Complete a final visual and functional review of the deployed application across supported devices, themes, and application states.

Verify that the application's existing responsive layouts behave correctly across supported screen sizes. This is application-wide validation, separate from the responsive card implementation tracked in Section 2.1.

- [ ] Verify Events, Venues, and Booking History layouts on mobile, tablet, laptop, and desktop.
- [ ] Check navigation, filters, forms, cards, and interactive controls at smaller widths.
- [ ] Check text wrapping, spacing, alignment, and horizontal overflow.
- [ ] Confirm touch targets and interactions remain usable on mobile.
- [ ] Verify responsive layouts in light and dark themes.
- [ ] Confirm card images, loading skeletons, and actions display correctly across viewport sizes.

#### Page-Level QA

- [ ] Review Events, Venues, and Booking History in populated states.
- [ ] Review loading states.
- [ ] Review empty states.
- [ ] Review error states and recovery behavior.
- [ ] Verify navigation and interactions remain consistent.
- [ ] Verify page layouts across supported viewport sizes.

#### Responsive Viewports

Use the following viewport sizes for manual browser testing:

| Device category | Viewport widths |
|---|---|
| Mobile | 320px, 375px, 430px |
| Tablet | 768px, 1024px |
| Desktop | 1440px |

Test additional intermediate widths only when a breakpoint or layout issue warrants it.

#### Reusable Error States and Recovery

**Status:** In Progress

Completed:

- [x] Implement reusable error-state components.
- [x] Support configurable headings, descriptions, illustrations, and retry actions.
- [x] Provide default and playful presentation variants.
- [x] Support light and dark themes.
- [x] Integrate error states into Events, Venues, and Booking History.
- [x] Add structured troubleshooting information where appropriate.
- [x] Add tests for ErrorState, EventsPage, and VenuesPage.
- [x] Test retry success, retry failure, and recovery behavior.
- [x] Preserve independent, compact booking-history status on the Events page.

Remaining:

- [ ] Replace overly technical error messages where appropriate.
- [ ] Verify retry and recovery after the API becomes available again.
- [ ] Verify loading-to-error transitions and recovery during a broader backend outage.

The booking-history endpoint's specific failure and recovery behavior has already been manually verified. Broader backend-outage behavior remains outstanding.

#### Optional Network QA

- [ ] Test page behavior under network throttling.
- [ ] Evaluate slower connections and delayed API responses.
- [ ] Verify loading indicators remain useful during longer requests.

### 4.2 General Repository Polish

- [ ] Audit CSS usage of `!important`.
- [ ] Remove unnecessary overrides where safe.
- [ ] Keep cleanup scoped to areas with clear maintainability or presentation benefits.
- [ ] Avoid broad refactoring unrelated to current project goals.

### 4.3 Navigation Bar Styling

**Status:** Optional

Evaluate improvements to the navigation bar's visual presentation and layout.

- [ ] Review navigation alignment and spacing.
- [ ] Evaluate centering navigation links within the available layout.
- [ ] Improve visual hierarchy between branding, navigation links, and account actions.
- [ ] Ensure the navigation remains balanced across desktop and mobile.
- [ ] Preserve existing navigation behavior and responsive layouts.

### 4.4 Sticky Navigation

- [ ] Evaluate whether a sticky navigation bar improves usability.
- [ ] Verify it does not consume excessive space on mobile.
- [ ] Check scrolling and anchor-navigation behavior.

### 4.5 Collapsible Card Evaluation

- [ ] Evaluate whether long card content should be collapsible.
- [ ] Preserve access to important information without unnecessary interaction.
- [ ] Verify behavior on mobile and desktop.

### 4.6 Search and Filter Usability

- [ ] Evaluate collapsible search and filter sections.
- [ ] Consider grouping date and time filters into a more compact interface.
- [ ] Preserve filter state when sections are collapsed or expanded.
- [ ] Verify keyboard and screen-reader accessibility.

### 4.7 Accessibility Improvements

- [ ] Review keyboard navigation across the application.
- [ ] Review accessible labels and descriptions.
- [ ] Verify focus visibility and focus management.
- [ ] Review color contrast in light and dark themes.
- [ ] Verify screen-reader behavior for interactive controls and status messages.

### 4.8 Pricing and Ratings

**Status:** Deferred

Potential future venue and event enhancements:

- [ ] Evaluate adding venue pricing information.
- [ ] Evaluate adding ratings and reviews.
- [ ] Determine whether these features provide meaningful value to the booking workflow.
- [ ] Avoid displaying placeholder or misleading ratings and prices.

### 4.9 Four Seasons Theme

**Status:** Optional

Explore seasonal visual themes:

- Spring 🌸
- Summer ☀️
- Autumn 🍂
- Winter ❄️

- [ ] Evaluate whether seasonal themes add meaningful value.
- [ ] Ensure themes preserve readability and accessibility.
- [ ] Keep the existing light/dark theme behavior intact.

### 4.10 Capacity and Attendance Filters

- [ ] Explore filtering events by remaining capacity.
- [ ] Consider filtering by confirmed attendee count.
- [ ] Ensure capacity calculations exclude active holds where appropriate.
- [ ] Verify filtering remains consistent with booking constraints.

### 4.11 User Settings Page

**Status:** Deferred

Explore a centralized settings page for user-configurable application preferences.

Potential settings:

- Language preference.
- Preferred timezone.
- Date and time display preferences.
- Theme preference (light/dark).
- Other relevant display and accessibility preferences.

- [ ] Evaluate which preferences provide meaningful user value.
- [ ] Design a centralized settings interface.
- [ ] Implement language selection and localization support.
- [ ] Implement a configurable timezone preference.
- [ ] Allow users to manage display preferences.
- [ ] Persist preferences appropriately.
- [ ] Ensure settings are consistently applied across the application.

**Constraints:**
- Avoid adding settings that do not meaningfully improve the user experience.
- Keep application defaults sensible.
- Avoid introducing unnecessary backend complexity for preferences that can be stored locally.

### 4.12 Statistical Event Discovery and Analytics

- [ ] Explore useful aggregate statistics for events and bookings.
- [ ] Evaluate trends in attendance and booking activity.
- [ ] Consider whether analytics improve event discovery or administrative workflows.
- [ ] Avoid introducing analytics without a clear user-facing purpose.

### 4.13 AI Search Analytics Dashboard

**Status:** Optional

Consider an administrative view of natural-language search behavior after observability and privacy requirements have been addressed.

Potential metrics:

- Search request volume.
- Provider latency.
- Provider error rates.
- Parsing and validation failures.
- Search result counts.
- Common search filters and date expressions.

- [ ] Define useful metrics and their intended audience.
- [ ] Establish privacy-safe data collection.
- [ ] Evaluate whether a dashboard is justified by actual usage.
- [ ] Avoid collecting unnecessary user query data.

### 4.14 AI-Assisted Localization

- [ ] Evaluate support for additional application languages.
- [ ] Separate user-facing strings from application logic.
- [ ] Review translated dates, times, and status labels.
- [ ] Ensure AI-generated translations are validated before display.

### 4.15 Angular Frontend Migration

**Status:** Deferred

Explore an Angular frontend as a separate implementation while preserving the existing React application.

**Branch:** `feature/angular-frontend`

#### Scope

- Create the Angular implementation on a separate branch from `main`.
- Keep the existing React frontend intact on `main`.
- Reuse the existing NestJS backend, PostgreSQL database, and Gemini integration.
- Reuse the existing API contracts and database schema.
- Adapt backend functionality only when the Angular implementation reveals a genuine API requirement.

#### Implementation

- [ ] Create `feature/angular-frontend` from the current `main` branch.
- [ ] Set up Angular and its development/build configuration.
- [ ] Recreate the main application layout and navigation.
- [ ] Implement Events, Venues, and Booking History pages.
- [ ] Integrate existing backend endpoints.
- [ ] Recreate search, filtering, and calendar interactions.
- [ ] Recreate booking creation, confirmation, and cancellation flows.
- [ ] Recreate loading, empty, and error states.
- [ ] Implement responsive layouts and light/dark themes.
- [ ] Adapt browser-based E2E tests where they depend on React-specific implementation details.
- [ ] Run the existing backend and database test suites without unnecessary changes.
- [ ] Document the Angular implementation and its differences from React.

#### Definition of Done

- Angular frontend builds and runs independently.
- Existing backend functionality is reused.
- Core user workflows work against the existing API.
- Existing React implementation remains intact.
- Backend and database regression tests continue to pass.
- Angular-specific E2E coverage is added where appropriate.

#### Constraints

- Do not rewrite the NestJS backend.
- Do not duplicate backend business logic in Angular.
- Preserve existing database schema and API contracts unless a concrete requirement justifies a change.
- Keep the React implementation available and functional.
- Do not rewrite backend-only tests merely to accommodate a frontend migration.

---

## 5. Completed Milestones

This section records completed work for historical reference. New work should be tracked under the active milestones or planned improvements rather than duplicated here.

### 5.1 Documentation and Roadmap Maintenance

**Status:** Completed

- [x] Update the roadmap to reflect the current project phase.
- [x] Audit AI search implementation and document remaining concerns.
- [x] Categorize remaining AI search work.
- [x] Review README links and checklist accuracy.
- [x] Remove unnecessary whitespace and formatting inconsistencies.

### 5.2 Showcase and Development Database Separation

**Status:** Completed

**Commit:** `5d34a7b`

- [x] Separate portfolio showcase data from general development fixtures.
- [x] Add a create-only showcase database initialization script.
- [x] Preserve useful development fixtures.
- [x] Add representative confirmed demo bookings.
- [x] Verify showcase seeding is idempotent.
- [x] Verify expected showcase database contents.
- [x] Verify Events page displays showcase events and booking states.
- [x] Verify Booking History displays seeded demo bookings.

### 5.3 Confirmed Attendee Counts on Event Cards

**Status:** Implemented, tested, committed, and pushed

#### Backend

- [x] Derive attendee counts from confirmed bookings.
- [x] Exclude active booking holds from confirmed attendee counts.
- [x] Preserve events with zero bookings using `LEFT JOIN` and `COALESCE`.
- [x] Return attendee counts from event listing endpoints.
- [x] Return attendee counts from keyword search.
- [x] Return attendee counts from AI-powered search.
- [x] Update relevant backend response types.
- [x] Add backend query and regression tests.

#### Frontend

- [x] Add `attendee_count` to relevant frontend types.
- [x] Display attendee counts on event cards.
- [x] Handle singular and plural attendee labels.
- [x] Rename the label to make its meaning clear.
- [x] Provide an appropriate fallback when the count is unavailable.
- [x] Add frontend regression coverage.

#### Verification

- [x] Verify behavior with a local database override.
- [x] Verify query behavior through automated tests.
- [x] Run backend and frontend builds.
- [x] Run the relevant test suites.
- [x] Verify showcase database behavior in the browser.
- [x] Verify attendee counts through keyword search.
- [x] Verify attendee counts through AI search.
- [x] Complete final diff checks.

**Recorded test results:** 463 backend tests and 226 frontend tests passed.

### 5.4 Phase 5 Reliability Audit

**Status:** Completed

- [x] Review database safety protections.
- [x] Verify test database name validation.
- [x] Verify protected test database reset behavior.
- [x] Review database initialization and seeding safeguards.
- [x] Verify PostgreSQL integration test behavior.
- [x] Review booking hold expiration and confirmation behavior.
- [x] Review concurrency-sensitive database operations.
- [x] Document remaining reliability work.

### 5.5 Structured Backend Logging and Observability

**Status:** Completed

**PR:** #19

- [x] Implement structured backend logging.
- [x] Add request-scoped context using `AsyncLocalStorage`.
- [x] Add request ID propagation through `X-Request-ID`.
- [x] Add centralized exception handling.
- [x] Preserve request correlation across backend operations.
- [x] Verify logging and exception behavior through automated tests.

### 5.6 Calendar and AI Search Integration

**Status:** Completed

**PR:** #21

- [x] Integrate calendar filters with event search.
- [x] Add natural-language search using Gemini.
- [x] Add relative-date validation.
- [x] Support clarification when natural-language filters conflict.
- [x] Implement Sunday-to-Saturday interpretation of "next week".
- [x] Add time-of-day multi-select filtering.
- [x] Add a bounded custom time picker.
- [x] Add a 12-hour/24-hour display toggle.
- [x] Keep internal time values in `HH:mm` format.
- [x] Share time-of-day interval definitions between frontend and backend.
- [x] Preserve explicit distinction between undefined time filters and empty arrays.
- [x] Support calendar-only searches without calling Gemini.
- [x] Preserve the intended behavior of the `includeFutureEvents` option.
- [x] Add regression coverage for date and time filtering.
- [x] Verify dark-mode presentation.

**Recorded validation:**
- Backend: 458/458 tests passed.
- Frontend: 159/159 tests passed.
- Production builds passed.
- Diff checks passed.

### 5.7 Immediate Booking Status on Event Cards

**Status:** Completed

- [x] Update event-card booking status after booking actions.
- [x] Reflect relevant booking changes without requiring a full page reload.
- [x] Preserve correct behavior when booking requests fail.
- [x] Verify booking status updates through the API.
- [x] Verify the UI remains consistent with backend booking state.
- [x] Add regression coverage for booking status presentation and updates.
- [x] Verify network request behavior and relevant error cases.

### 5.8 Prisma Scaffolding Cleanup

**Status:** Completed

- [x] Remove unused Prisma scaffolding.
- [x] Preserve the existing PostgreSQL access approach.
- [x] Verify the backend builds and tests after cleanup.
- [x] Ensure documentation reflects the actual database implementation.

### 5.9 Reusable Loading States

**Status:** Completed

- [x] Implement reusable loading-state components.
- [x] Support consistent loading presentation across relevant pages.
- [x] Verify loading states work with existing page layouts.
- [x] Add regression tests where appropriate.

### 5.10 Skeleton Loading UI

**Status:** Completed

- [x] Add skeleton loading presentation for relevant content.
- [x] Ensure skeletons match the structure of their corresponding cards.
- [x] Verify theme compatibility.
- [x] Verify responsive behavior.

### 5.11 Booking Button Styling

**Status:** Completed

- [x] Improve booking button presentation.
- [x] Improve cancellation button presentation.
- [x] Keep button styling consistent with the rest of the interface.
- [x] Preserve existing booking and cancellation behavior.
- [x] Verify relevant tests remain passing.

### 5.12 Booking-History Failure Handling and Error-State Polish

**Status:** Completed

- [x] Handle booking-history API failures.
- [x] Display an appropriate error state when booking history cannot be loaded.
- [x] Provide a retry action.
- [x] Verify retry behavior after the API becomes available again.
- [x] Preserve appropriate loading and disabled-button behavior.
- [x] Verify the Events page can recover after a booking-history request fails.
- [x] Add regression coverage for failure and recovery behavior.
- [x] Review the presentation of error messages and recovery controls.

**Manual verification procedure:**

1. Open the application and navigate to the Events page.
2. Use Chrome DevTools to block the booking-history endpoint, such as `http://localhost:3000/users/1/bookings`.
3. Reload the page.
4. Verify the booking-history request transitions into an error state.
5. Verify the error message and retry control are displayed.
6. Restore the blocked request.
7. Retry the request.
8. Verify booking history recovers without requiring a full page reload.

### 5.13 Compact Loading Indicators

**Status:** Completed

- [x] Add compact loading indicators where full-page loading states are unnecessary.
- [x] Keep loading feedback visually consistent with the application.
- [x] Verify indicators do not disrupt surrounding layouts.
- [x] Verify theme compatibility.

---

## 6. Technical Decisions and Constraints

This section records project-wide implementation decisions that should guide future work.

### 6.1 Environment Configuration

- NestJS `ConfigModule.forRoot()` loads the root `.env` file using the documented backend startup process.
- `.env` is excluded from source control.
- Secrets must never be committed.
- Do not add unnecessary environment configuration layers when the existing setup already works.
- Keep environment variable documentation accurate and synchronized with actual usage.

### 6.2 Database Access

- The application uses PostgreSQL through direct SQL and the `pg` library.
- Database access uses a connection pool.
- Queries use parameterized SQL.
- Transactions and row-level locks protect concurrency-sensitive booking operations.
- Prisma is not part of the implemented database architecture.
- Do not introduce an ORM without a concrete maintainability or functional requirement.

### 6.3 Scope Management

- Prioritize working, demonstrable functionality over adding technologies for résumé keywords.
- Do not describe planned functionality as implemented.
- Avoid introducing Kafka, Redis, Kubernetes, or other infrastructure unless the application has a genuine requirement for it.
- Preserve existing tests and implementation behavior when making focused changes.
- Prefer targeted improvements over broad rewrites.
- Keep documentation aligned with the actual codebase.
- Move work between roadmap sections when its status changes rather than duplicating the same task in multiple sections.

---

## 7. Historical Audits

### 7.1 AI Search Implementation Audit

**Audit date:** November 8, 2026

**Scope:** Review the existing Gemini-powered natural-language event search implementation, its validation pipeline, provider error handling, and associated tests.

#### Implementation Reviewed

- `4. backend/src/search/natural-language-search.service.ts`
- `4. backend/src/events/search/gemini-event-search-interpreter.ts`
- `4. backend/src/events/search/gemini-event-ranker.ts`
- `4. backend/src/events/search/ParseNaturalLanguageSearchInterpreterHelpers.ts`
- `4. backend/src/search/natural-language-search.ts`
- `4. backend/src/ai/gemini/gemini-client-config.ts`
- `4. backend/src/events/events.controller.ts`
- `4. backend/src/events/events.module.ts`

#### Tests Reviewed

- `0. tests/backend/ai/geminiSearchInterpreter.test.ts`
- `0. tests/backend/ai/geminiSearchInterpreterErrors.test.ts`
- `0. tests/backend/ai/geminiEventRanker.test.ts`
- `0. tests/backend/search/naturalLanguageSearchFailures.test.ts`
- `0. tests/backend/search/validateNaturalLanguageSearchPlan.test.ts`
- `0. tests/backend/events/search/searchEventsController.test.ts`

#### Existing Implementation Findings

- [x] The search pipeline supplies Toronto-local date context using `America/Toronto`.
- [x] Gemini receives a structured JSON response schema.
- [x] Model output is parsed and validated before being used as a search plan.
- [x] Unsupported properties are rejected during validation.
- [x] Optional intent, length, and date-range fields are validated.
- [x] Gemini requests use a 20-second timeout and up to 2 retries.
- [x] Abort, HTTP 503, and HTTP 504 failures are normalized into controlled service-unavailable errors.
- [x] Candidate event data is treated as untrusted input in the ranking prompt.
- [x] Database access remains controlled by backend code rather than arbitrary model-generated SQL.

#### Outstanding Findings

- Relative-date accuracy had not been established through sufficient real-provider testing.
- Date boundaries, timezone behavior, and daylight-saving transitions required further verification.
- Missing API-key behavior did not yet provide an actionable client-facing response.
- Only selected provider failures were normalized; other errors could propagate unchanged.
- No rate limiting was identified for the natural-language search endpoint in the inspected implementation.
- Global structured logging did not by itself establish sufficient AI-specific observability.
- Dedicated prompt-injection tests had not been identified.
- Structured output validation existed, but further security regression coverage was warranted.

Follow-up work from this audit is tracked in Section 3:

- AI Search Correctness and Provider Error Handling
- AI Search Observability
- AI Search Security Improvements
- AI Search Rate Limiting

---

**Last Updated:** November 23, 2026
