import type { ConcurrentRaceWinner } from "../../types/bookingHoldRace.types";


export const CONCURRENT_RACE_WINNERS = [
    "cancellation",
    "confirmation",
] as const satisfies readonly ConcurrentRaceWinner[];

export const HOLD_STATUS_UPDATE_MATCHER = (query: string): boolean =>
    query.includes("UPDATE booking_holds")
    && query.includes("SET status = CASE");

export const USER_ROW_LOCK_WAIT_QUERY = `
    SELECT COUNT(*)::int AS count
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state = 'active'
      AND wait_event_type = 'Lock'
      AND query ILIKE '%FROM users%'
      AND query ILIKE '%FOR UPDATE%';
`;

export const LOCK_WAIT_TIMEOUT_MS = 3_000;
export const LOCK_WAIT_POLL_INTERVAL_MS = 10;
