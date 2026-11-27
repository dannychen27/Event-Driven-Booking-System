import { useEffect, useRef, useState } from "react";
import { CalendarX } from "lucide-react";
import type { Event } from "../types/events/Event.ts";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
    NaturalLanguageSearchResolutions,
    SearchFilterConflict,
    SearchFilterResolution,
} from "../types/search/NaturalLanguageSearch.types.ts";
import type { BookingHistoryStatus } from "../types/events/EventCard.types.ts";
import "../styles/pages/events-page.css";
import "../styles/errors/error-message.css";
import "../styles/errors/status-message.css";
import "../styles/errors/empty-state-message.css";
import {
    handleApplyCalendarFilters,
    handleClearSearch,
    handleNaturalLanguageSearch,
    handleResolveNaturalLanguageSearch,
    handleSearch,
} from "../helpers/search/EventSearchHelpers.ts";
import { getEvents } from "../api/events";
import { getVenues } from "../api/venues.ts";
import { getBookingHistory } from "../api/bookings.ts";
import { BOOKING_USER_ID } from "../constants/bookings/booking.ts";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Skeleton from "../components/ui/Skeleton";
import EventCardSkeleton from "../components/ui/skeletons/EventCardSkeleton";
import EventSearchForm from "../components/forms/EventSearchForm.tsx";
import AiSearchForm from "../components/forms/AiSearchForm";
import CalendarSearchControls from "../components/forms/CalendarSearchControls.tsx";
import ActiveFilterSummary, {
    type ActiveFilterSummaryItem,
} from "../components/ui/ActiveFilterSummary.tsx";
import SearchFilterClarification from "../components/forms/SearchFilterClarification.tsx";
import {
    displayAllEvents,
    displayNoEvents,
} from "../helpers/events/EventsPageHelpers.tsx";

function formatDateFilter(date: CalendarDateRange): string {
    const format = (value: string) =>
        new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    if (date.startDate === date.endDate) return format(date.startDate);
    return `${format(date.startDate)} – ${format(date.endDate)}`;
}

function formatTimeFilter(time: CalendarTimeSelection): string {
    const labels: Record<string, string> = {
        EARLY_MORNING: "Early morning",
        MORNING: "Morning",
        AFTERNOON: "Afternoon",
        EVENING: "Evening",
        NIGHT: "Night",
    };

    const parts = (time.timeOfDay ?? []).map((value) => labels[value]);
    const range = time.timeRange;

    if (range?.startTime || range?.endTime) {
        parts.push(
            `${range.startTime || "Any time"} – ${range.endTime || "Any time"}`,
        );
    }

    return parts.join(", ");
}

function readSelectedVenueId(): number | null {
    const rawVenueId = new URLSearchParams(window.location.search).get(
        "venueId",
    );

    if (!rawVenueId) return null;

    const venueId = Number(rawVenueId);

    return Number.isSafeInteger(venueId) && venueId > 0
        ? venueId
        : null;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [eventsRetry, setEventsRetry] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [submittedKeyword, setSubmittedKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
    const [clarificationConflicts, setClarificationConflicts] =
        useState<SearchFilterConflict[] | null>(null);
    const [clarificationResolutions, setClarificationResolutions] =
        useState<NaturalLanguageSearchResolutions>({});

    const [bookedEventIds, setBookedEventIds] = useState<Set<number>>(new Set());
    const [bookingHistoryStatus, setBookingHistoryStatus] =
        useState<BookingHistoryStatus>("loading");
    const [bookingHistoryRetry, setBookingHistoryRetry] = useState(0);

    const [selectedVenueId, setSelectedVenueId] =
        useState<number | null>(readSelectedVenueId);
    const [selectedVenueName, setSelectedVenueName] =
        useState<string | null>(null);

    const [dateSelection, setDateSelection] = useState<
        ExplicitSelection<CalendarDateRange> | undefined
    >(undefined);

    const [timeSelection, setTimeSelection] = useState<
        ExplicitSelection<CalendarTimeSelection> | undefined
    >(undefined);

    const [hasPendingCalendarFilterChanges, setHasPendingCalendarFilterChanges] =
        useState(false);
    const [appliedNaturalLanguageQuery, setAppliedNaturalLanguageQuery] =
        useState("");
    const [appliedDateSelection, setAppliedDateSelection] =
        useState<CalendarDateRange | undefined>();
    const [appliedTimeSelection, setAppliedTimeSelection] =
        useState<CalendarTimeSelection | undefined>();

    const searchRequestId = useRef(0);
    const searchRowRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const searchRow = searchRowRef.current;
        const sidebar = sidebarRef.current;

        if (!searchRow || !sidebar) {
            return;
        }

        const updateStickyOffset = () => {
            sidebar.style.setProperty(
                "--events-search-row-height",
                `${searchRow.getBoundingClientRect().height}px`,
            );
        };

        updateStickyOffset();

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(updateStickyOffset)
                : null;

        resizeObserver?.observe(searchRow);

        return () => {
            resizeObserver?.disconnect();
            sidebar.style.removeProperty("--events-search-row-height");
        };
    }, [loading]);

    function clearAppliedFilterSnapshot() {
        setAppliedNaturalLanguageQuery("");
        setAppliedDateSelection(undefined);
        setAppliedTimeSelection(undefined);
    }

    function recordSuccessfulSearch(
        query: string,
        mode: "keyword" | "natural-language",
        appliedDate?: ExplicitSelection<CalendarDateRange>,
        appliedTime?: ExplicitSelection<CalendarTimeSelection>,
    ) {
        setAppliedNaturalLanguageQuery(
            mode === "natural-language" ? query : "",
        );
        setAppliedDateSelection(
            appliedDate?.state === "selected" ? appliedDate.value : undefined,
        );
        setAppliedTimeSelection(
            appliedTime?.state === "selected" ? appliedTime.value : undefined,
        );
    }

    function clearClarification() {
        setClarificationConflicts(null);
        setClarificationResolutions({});
    }

    function updateClarificationConflicts(
        conflicts: SearchFilterConflict[] | null,
    ) {
        setClarificationConflicts(conflicts);

        if (conflicts) {
            setClarificationResolutions({});
        }
    }

    function updateClarificationResolution(
        category: SearchFilterConflict["category"],
        resolution: SearchFilterResolution,
    ) {
        setClarificationResolutions((current) => ({
            ...current,
            [category]: resolution,
        }));
    }

    useEffect(() => {
        let isActive = true;

        async function fetchEvents() {

            try {
                const fetchedEvents = await getEvents();

                if (isActive) {
                    setEvents(fetchedEvents);
                    setError("");
                }
            } catch {
                if (isActive) {
                    setError("failed");
                }
            } finally {
                if (isActive) {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            }
        }

        void fetchEvents();

        return () => {
            isActive = false;
        };
    }, [eventsRetry]);

    useEffect(() => {
        let isActive = true;

        async function fetchBookingHistory() {
            setBookingHistoryStatus("loading");

            try {
                const bookings = await getBookingHistory(BOOKING_USER_ID);

                if (isActive) {
                    setBookedEventIds(
                        new Set(
                            bookings
                                .filter((booking) => booking.status === "confirmed")
                                .map((booking) => booking.event_id),
                        ),
                    );
                    setBookingHistoryStatus("ready");
                }
            } catch {
                if (isActive) {
                    setBookingHistoryStatus("error");
                }
            }
        }

        void fetchBookingHistory();

        return () => {
            isActive = false;
        };
    }, [bookingHistoryRetry]);

    useEffect(() => {
        function handleLocationChange() {
            setSelectedVenueId(readSelectedVenueId());
        }

        window.addEventListener("popstate", handleLocationChange);

        return () => {
            window.removeEventListener("popstate", handleLocationChange);
        };
    }, []);

    // Resolve the venue name for the selected venue context.
    useEffect(() => {
        if (selectedVenueId === null) {
            setSelectedVenueName(null);
            return;
        }

        let isActive = true;

        setSelectedVenueName(null);

        async function fetchSelectedVenue() {
            try {
                const venues = await getVenues();

                if (!isActive) return;

                const selectedVenue = venues.find(
                    (venue) => venue.id === selectedVenueId,
                );

                setSelectedVenueName(
                    selectedVenue?.name.trim() || null,
                );
            } catch {
                if (isActive) {
                    setSelectedVenueName(null);
                }
            }
        }

        void fetchSelectedVenue();

        return () => {
            isActive = false;
        };
    }, [selectedVenueId]);

    function handleBookingCreated(eventId: number) {
        setBookedEventIds((current) => {
            const updated = new Set(current);
            updated.add(eventId);
            return updated;
        });

        setEvents((current) =>
            current.map((event) =>
                event.id === eventId
                    ? { ...event, attendee_count: event.attendee_count + 1 }
                    : event,
            ),
        );
    }

    function retryEvents() {
        setError("");
        setLoading(true);
        setEventsRetry((current) => current + 1);
    }

    function retryBookingHistory() {
        setBookingHistoryStatus("loading");
        setBookingHistoryRetry((current) => current + 1);
    }

    function clearVenueFilter() {
        const searchParams = new URLSearchParams(window.location.search);

        searchParams.delete("venueId");

        const remainingQuery = searchParams.toString();
        const nextUrl = [
            window.location.pathname,
            remainingQuery ? `?${remainingQuery}` : "",
            window.location.hash,
        ].join("");

        window.history.replaceState({}, "", nextUrl);

        setSelectedVenueId(null);
        setSelectedVenueName(null);
    }

    async function removeActiveFilter(filterId: string) {
        if (filterId === "venue") {
            clearVenueFilter();
            return;
        }

        let nextDate: ExplicitSelection<CalendarDateRange> = appliedDateSelection
            ? { state: "selected", value: appliedDateSelection }
            : { state: "cleared" };
        let nextTime: ExplicitSelection<CalendarTimeSelection> = appliedTimeSelection
            ? { state: "selected", value: appliedTimeSelection }
            : { state: "cleared" };
        let nextKeyword = submittedKeyword;
        let nextAiQuery = appliedNaturalLanguageQuery;

        if (filterId === "keyword") {
            nextKeyword = "";
            setKeyword("");
            setSubmittedKeyword("");
        } else if (filterId === "ai") {
            nextAiQuery = "";
            setNaturalLanguageQuery("");
        } else if (filterId === "date") {
            nextDate = { state: "cleared" };
        } else if (filterId === "time") {
            nextTime = { state: "cleared" };
        }

        // Explicit clears let the search API remove the final remaining filter.
        if (
            !nextKeyword &&
            !nextAiQuery &&
            nextDate?.state !== "selected" &&
            nextTime?.state !== "selected"
        ) {
            nextDate = { state: "cleared" };
            nextTime = { state: "cleared" };
        }

        const hasRemainingSearchFilters =
            Boolean(nextKeyword?.trim()) ||
            Boolean(nextAiQuery?.trim()) ||
            nextDate?.state === "selected" ||
            nextTime?.state === "selected";

        if (!hasRemainingSearchFilters) {
            clearAppliedFilterSnapshot();

            await handleClearSearch({
                searchRequestId,
                setEvents,
                setSearching,
                setSearchError,
                setIsSearchActive,
                setKeyword,
                setSubmittedKeyword,
                setNaturalLanguageQuery,
                setClarificationConflicts,
                setDateSelection,
                setTimeSelection,
                setHasPendingCalendarFilterChanges,
            });

            clearClarification();
            return;
        }

        setDateSelection(nextDate);
        setTimeSelection(nextTime);
        setHasPendingCalendarFilterChanges(true);
        setSearchError("");
        clearClarification();

        await handleApplyCalendarFilters({
            query: nextAiQuery,
            submittedKeyword: nextKeyword,
            setSubmittedKeyword,
            dateSelection: nextDate,
            timeSelection: nextTime,
            searchRequestId,
            setEvents,
            setSearching,
            setSearchError,
            setIsSearchActive,
            setClarificationConflicts: updateClarificationConflicts,
            hasPendingCalendarFilterChanges: true,
            setHasPendingCalendarFilterChanges,
            appliedNaturalLanguageQuery: nextAiQuery,
            onSearchSuccess: recordSuccessfulSearch,
        });
    }

    function clearAllActiveFilters() {
        clearAppliedFilterSnapshot();
        clearVenueFilter();

        void handleClearSearch({
            searchRequestId,
            setEvents,
            setSearching,
            setSearchError,
            setIsSearchActive,
            setKeyword,
            setSubmittedKeyword,
            setNaturalLanguageQuery,
            setClarificationConflicts,
            setDateSelection,
            setTimeSelection,
            setHasPendingCalendarFilterChanges,
        }).then(clearClarification);
    }

    const displayedVenueName =
        selectedVenueName || `Venue #${selectedVenueId}`;

    const activeFilterItems: ActiveFilterSummaryItem[] = [];

    if (submittedKeyword) {
        activeFilterItems.push({
            id: "keyword",
            label: "Keyword",
            value: submittedKeyword,
            onRemove: () => void removeActiveFilter("keyword"),
        });
    }

    if (appliedNaturalLanguageQuery) {
        activeFilterItems.push({
            id: "ai",
            label: "AI search",
            value: appliedNaturalLanguageQuery,
            onRemove: () => void removeActiveFilter("ai"),
        });
    }

    if (appliedDateSelection) {
        activeFilterItems.push({
            id: "date",
            label: "Date",
            value: formatDateFilter(appliedDateSelection),
            onRemove: () => void removeActiveFilter("date"),
        });
    }

    if (appliedTimeSelection) {
        activeFilterItems.push({
            id: "time",
            label: "Time",
            value: formatTimeFilter(appliedTimeSelection),
            onRemove: () => void removeActiveFilter("time"),
        });
    }

    if (selectedVenueId !== null) {
        activeFilterItems.push({
            id: "venue",
            label: "Venue",
            value: displayedVenueName,
            onRemove: () => void removeActiveFilter("venue"),
        });
    }

    const displayedEvents =
        selectedVenueId === null
            ? events
            : events.filter((event) => event.venue_id === selectedVenueId);

    if (loading) {
        return (
            <section
                className="events-page skeleton-loading"
                aria-busy="true"
            >
                <LoadingState message="Loading events..." />

                <h1>
                    <Skeleton width="10rem" height="2rem" variant="text" />
                </h1>

                <div aria-hidden="true">
                    <div className="event-search-skeleton">
                        <Skeleton width="8rem" height="1rem" variant="text" />
                        <div className="event-search-skeleton__controls">
                            <Skeleton
                                height="2.75rem"
                                className="event-search-skeleton__input"
                            />
                            <Skeleton
                                height="2.75rem"
                                className="event-search-skeleton__button"
                            />
                            <Skeleton
                                height="2.75rem"
                                className="event-search-skeleton__clear"
                            />
                        </div>
                    </div>

                    <div className="event-ai-search-skeleton">
                        <Skeleton width="8rem" height="1.1rem" variant="text" />
                        <Skeleton width="85%" height="0.9rem" variant="text" />

                        <div className="event-ai-search-skeleton__examples">
                            <Skeleton
                                width="7rem"
                                height="0.9rem"
                                variant="text"
                                className="event-ai-search-skeleton__examples-label"
                            />
                            <Skeleton
                                width="8rem"
                                height="2rem"
                                className="event-ai-search-skeleton__example"
                            />
                            <Skeleton
                                width="10rem"
                                height="2rem"
                                className="event-ai-search-skeleton__example"
                            />
                            <Skeleton
                                width="9rem"
                                height="2rem"
                                className="event-ai-search-skeleton__example"
                            />
                        </div>

                        <div className="event-ai-search-skeleton__controls">
                            <Skeleton
                                height="2.75rem"
                                className="event-ai-search-skeleton__input"
                            />
                            <Skeleton
                                height="2.75rem"
                                className="event-ai-search-skeleton__button"
                            />
                            <Skeleton
                                height="2.75rem"
                                className="event-ai-search-skeleton__clear"
                            />
                        </div>
                    </div>

                    <div className="event-calendar-skeleton">
                      <div className="event-calendar-skeleton__section">
                          <div className="event-calendar-skeleton__section-heading">
                              <Skeleton width="3rem" variant="text" />
                              <Skeleton width="5rem" height="1.8rem" />
                          </div>

                          <div className="event-calendar-skeleton__fields">
                              <div className="event-calendar-skeleton__field">
                                  <Skeleton width="2.5rem" variant="text" />
                                  <Skeleton />
                              </div>
                              <div className="event-calendar-skeleton__field">
                                  <Skeleton width="2rem" variant="text" />
                                  <Skeleton />
                              </div>
                          </div>
                      </div>

                      <div className="event-calendar-skeleton__section">
                          <div className="event-calendar-skeleton__section-heading">
                              <Skeleton width="3rem" variant="text" />

                              <div className="event-calendar-skeleton__heading-actions">
                                  <div className="event-calendar-skeleton__toggle">
                                      <Skeleton />
                                      <Skeleton />
                                  </div>
                                  <Skeleton width="5rem" height="1.8rem" />
                              </div>
                          </div>

                          <div className="event-calendar-skeleton__section">
                              <Skeleton width="6rem" variant="text" />
                              <div className="event-calendar-skeleton__options">
                                  <Skeleton className="event-calendar-skeleton__option" />
                                  <Skeleton className="event-calendar-skeleton__option" />
                                  <Skeleton className="event-calendar-skeleton__option" />
                                  <Skeleton className="event-calendar-skeleton__option" />
                                  <Skeleton className="event-calendar-skeleton__option" />
                              </div>
                          </div>

                          <div className="event-calendar-skeleton__time-range">
    {(["After", "Before"] as const).map((label) => (
        <div
            className="event-calendar-skeleton__time-picker"
            key={label}
        >
            <div className="event-calendar-skeleton__time-heading">
                <Skeleton width="3rem" variant="text" />
                <div className="event-calendar-skeleton__time-clear">
                    <Skeleton />
                </div>
            </div>
            <div className="event-calendar-skeleton__time-fields">
                <div className="event-calendar-skeleton__time-input"><Skeleton /></div>
                <span className="event-calendar-skeleton__time-separator"><Skeleton /></span>
                <div className="event-calendar-skeleton__time-input"><Skeleton /></div>
                <div className="event-calendar-skeleton__period">
                    <Skeleton />
                    <Skeleton />
                </div>
            </div>
        </div>
    ))}
</div>
<div className="event-calendar-skeleton__actions">
                          <Skeleton className="event-calendar-skeleton__apply" />
                      </div>
                  </div>

                    </div>
                  <div className="events-page__grid skeleton-loading__cards">
                        <EventCardSkeleton />
                        <EventCardSkeleton />
                        <EventCardSkeleton />
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <ErrorState
                title="We couldn't load the events."
                description={
                    <>
                        <p>We couldn't retrieve the events.</p>
                        <p>You can try the following:</p>
                        <ul>
                            <li>Check your internet connection and try again.</li>
                            <li>Refresh the page.</li>
                            <li>Wait a moment and try again.</li>
                        </ul>
                    </>
                }
                onRetry={retryEvents}
                retryLabel="Try again"
                className="error-state--page"
            />
        );
    }

    return (
        <div className="events-page">
            <h1>Events</h1>

            {selectedVenueId !== null && (
                <section
                    className="events-page__venue-filter"
                    aria-label="Selected venue filter"
                >
                    <p>
                        {`Showing events at ${displayedVenueName}`}
                    </p>

                    <button
                        type="button"
                        onClick={clearVenueFilter}
                    >
                        Clear venue filter
                    </button>
                </section>
            )}

            <div
                className="events-page__search-row"
                ref={searchRowRef}
            >
                <details className="events-search-disclosure">
                    <summary>Keyword search</summary>
                    <EventSearchForm
                    keyword={keyword}
                    searching={searching}
                    onKeywordChange={(value) => {
                        setKeyword(value);
                        setSearchError("");
                        clearClarification();
                    }}
                    onSearch={(event) =>
                        handleSearch(event, {
                            query: keyword,
                            setSubmittedKeyword,
                            dateSelection,
                            timeSelection,
                            searchRequestId,
                            setEvents,
                            setSearching,
                            setSearchError,
                            setIsSearchActive,
                            setHasPendingCalendarFilterChanges,
                            onSearchSuccess: recordSuccessfulSearch,
                        })
                    }
                    onClearQuery={() => {
                        setKeyword("");
                        setSearchError("");
                        clearClarification();
                    }}
                />
                </details>

                <details className="events-search-disclosure">
                    <summary>Search with AI</summary>
                    <AiSearchForm
                    prompt={naturalLanguageQuery}
                    searching={searching}
                    onQueryChange={(value) => {
                        setNaturalLanguageQuery(value);
                        setSearchError("");
                        clearClarification();
                    }}
                    onSearch={(event) =>
                        handleNaturalLanguageSearch(event, {
                            query: naturalLanguageQuery,
                            setSubmittedKeyword,
                            dateSelection,
                            timeSelection,
                            searchRequestId,
                            setEvents,
                            setSearching,
                            setSearchError,
                            setIsSearchActive,
                            setClarificationConflicts: updateClarificationConflicts,
                            setHasPendingCalendarFilterChanges,
                            onSearchSuccess: recordSuccessfulSearch,
                        })
                    }
                    onClearQuery={() => {
                        setNaturalLanguageQuery("");
                        setSearchError("");
                        clearClarification();
                    }}
                />
                </details>
            </div>

            <div className="events-page__layout">
                <aside
                    className="events-page__sidebar"
                    ref={sidebarRef}
                    aria-label="Event search and filters"
                >
                    <div className="events-page__search">
                        <div className="events-page__calendar-row">
                <CalendarSearchControls
                    dateSelection={dateSelection}
                    timeSelection={timeSelection}
                    disabled={searching}
                    hasPendingChanges={hasPendingCalendarFilterChanges}
                    onDateSelectionChange={(selection) => {
                        setDateSelection(selection);
                        setHasPendingCalendarFilterChanges(true);
                        setSearchError("");
                        clearClarification();
                    }}
                    onTimeSelectionChange={(selection) => {
                        setTimeSelection(selection);
                        setHasPendingCalendarFilterChanges(true);
                        setSearchError("");
                        clearClarification();
                    }}
                    onApplyFilters={() =>
                        void handleApplyCalendarFilters({
                            query: naturalLanguageQuery,
                            submittedKeyword,
                            setSubmittedKeyword,
                            dateSelection,
                            timeSelection,
                            searchRequestId,
                            setEvents,
                            setSearching,
                            setSearchError,
                            setIsSearchActive,
                            setClarificationConflicts: updateClarificationConflicts,
                            hasPendingCalendarFilterChanges,
                            setHasPendingCalendarFilterChanges,
                            appliedNaturalLanguageQuery,
                            onSearchSuccess: recordSuccessfulSearch,
                        })
                    }
                />
                        </div>
                    </div>
                </aside>

                <section
                    className="events-page__results"
                    aria-label="Event results"
                >
            <ActiveFilterSummary
                filters={activeFilterItems}
                resultCount={displayedEvents.length}
                resultNoun="event"
                hint="Filters reflect the last successful search. Calendar edits take effect when you apply them."
                onClearAll={clearAllActiveFilters}
            />
            {clarificationConflicts && (
                <SearchFilterClarification
                    conflicts={clarificationConflicts}
                    resolutions={clarificationResolutions}
                    disabled={searching}
                    onResolutionChange={updateClarificationResolution}
                    onApply={() =>
                        void handleResolveNaturalLanguageSearch({
                            query: naturalLanguageQuery,
                            setSubmittedKeyword,
                            dateSelection,
                            timeSelection,
                            conflicts: clarificationConflicts,
                            resolutions: clarificationResolutions,
                            searchRequestId,
                            setEvents,
                            setSearching,
                            setSearchError,
                            setIsSearchActive,
                            setClarificationConflicts: updateClarificationConflicts,
                            setHasPendingCalendarFilterChanges,
                            onSearchSuccess: recordSuccessfulSearch,
                        })
                    }
                />
            )}

            {searchError && (
                <p className="error-message" role="alert">
                    {searchError}
                </p>
            )}

            {bookingHistoryStatus === "error" && (
                <ErrorState
                    title="Couldn't check booking status"
                    description={
                        <>
                            <p>
                                Your events are still available, but we couldn't check which ones you've booked.
                            </p>
                            <p>You can retry this separately.</p>
                        </>
                    }
                    illustration={<CalendarX size={40} strokeWidth={1.8} />}
                    onRetry={retryBookingHistory}
                    retryLabel="Retry booking status"
                    variant="professional"
                    className="error-state--compact"
                />
            )}

            {searching && (
                <p className="status-message" role="status">
                    Searching events...
                </p>
            )}

            {!searching && displayedEvents.length === 0
                ? selectedVenueId !== null
                    ? (
                        <p className="empty-state-message">
                            {isSearchActive
                                ? `No matching events found at ${displayedVenueName}.`
                                : `No upcoming events are currently listed for ${displayedVenueName}.`}
                        </p>
                    )
                    : displayNoEvents(isSearchActive)
                : displayAllEvents(
                    displayedEvents,
                    bookedEventIds,
                    bookingHistoryStatus,
                    handleBookingCreated,
                )}
                </section>
            </div>
        </div>
    );
}
