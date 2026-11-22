import { useEffect, useRef, useState } from "react";
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
import { getBookingHistory } from "../api/bookings.ts";
import { BOOKING_USER_ID } from "../constants/bookings/booking.ts";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Skeleton from "../components/ui/Skeleton";
import EventCardSkeleton from "../components/ui/skeletons/EventCardSkeleton";
import EventSearchForm from "../components/forms/EventSearchForm.tsx";
import AiSearchForm from "../components/forms/AiSearchForm";
import CalendarSearchControls from "../components/forms/CalendarSearchControls.tsx";
import SearchFilterClarification from "../components/forms/SearchFilterClarification.tsx";
import {
    displayAllEvents,
    displayNoEvents,
} from "../helpers/events/EventsPageHelpers.tsx";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [eventsRetry, setEventsRetry] = useState(0);
    const [keyword, setKeyword] = useState("");
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

    const [dateSelection, setDateSelection] = useState<
        ExplicitSelection<CalendarDateRange> | undefined
    >(undefined);

    const [timeSelection, setTimeSelection] = useState<
        ExplicitSelection<CalendarTimeSelection> | undefined
    >(undefined);

    const searchRequestId = useRef(0);

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
                        new Set(bookings.map((booking) => booking.event_id)),
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

    function handleBookingCreated(eventId: number) {
        setBookedEventIds((current) => {
            const updated = new Set(current);
            updated.add(eventId);
            return updated;
        });
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
                              {Array.from({ length: 2 }, (_, index) => (
                                  <div
                                      className="event-calendar-skeleton__time-picker"
                                      key={index}
                                  >
                                      <Skeleton width="3rem" variant="text" />
                                      <div className="event-calendar-skeleton__time-fields">
                                          <div className="event-calendar-skeleton__time-segment">
                                              <Skeleton width="2rem" variant="text" />
                                              <Skeleton />
                                          </div>
                                          <Skeleton width="0.5rem" height="1rem" />
                                          <div className="event-calendar-skeleton__time-segment">
                                              <Skeleton width="2.5rem" variant="text" />
                                              <Skeleton />
                                          </div>
                                          <div className="event-calendar-skeleton__period">
                                              <Skeleton />
                                              <Skeleton />
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="event-calendar-skeleton__actions">
                          <Skeleton className="event-calendar-skeleton__apply" />
                      </div>
                  </div>

                  <div className="skeleton-loading__cards">
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
                        dateSelection,
                        timeSelection,
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                    })
                }
                onClearQuery={() =>
                    void handleClearSearch({
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                        setKeyword,
                        setNaturalLanguageQuery,
                        setClarificationConflicts,
                        setDateSelection,
                        setTimeSelection,
                    }).then(clearClarification)
                }
            />

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
                        dateSelection,
                        timeSelection,
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                        setClarificationConflicts: updateClarificationConflicts,
                    })
                }
                onClearQuery={() =>
                    void handleClearSearch({
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                        setKeyword,
                        setNaturalLanguageQuery,
                        setClarificationConflicts,
                        setDateSelection,
                        setTimeSelection,
                    }).then(clearClarification)
                }
            />

            <CalendarSearchControls
                dateSelection={dateSelection}
                timeSelection={timeSelection}
                disabled={searching}
                onDateSelectionChange={(selection) => {
                    setDateSelection(selection);
                    setSearchError("");
                    clearClarification();
                }}
                onTimeSelectionChange={(selection) => {
                    setTimeSelection(selection);
                    setSearchError("");
                    clearClarification();
                }}
                onApplyFilters={() =>
                    void handleApplyCalendarFilters({
                        query: naturalLanguageQuery,
                        dateSelection,
                        timeSelection,
                        searchRequestId,
                        setEvents,
                        setSearching,
                        setSearchError,
                        setIsSearchActive,
                        setClarificationConflicts: updateClarificationConflicts,
                    })
                }
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
                    description="Your events are still available, but we couldn't check which ones you've booked.\nYou can retry this separately."
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

            {!searching && events.length === 0
                ? displayNoEvents(isSearchActive)
                : displayAllEvents(
                    events,
                    bookedEventIds,
                    bookingHistoryStatus,
                    handleBookingCreated,
                )}
        </div>
    );
}
