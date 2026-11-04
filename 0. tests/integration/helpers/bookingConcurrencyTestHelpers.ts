import type { PoolClient } from "pg";

const CONFLICT_CHECK_TIMEOUT_MS = 1500;


function hasTextProperty(
    query: unknown,
): query is { text: string } {
    return (
        typeof query === "object" &&
        query !== null &&
        "text" in query &&
        typeof query.text === "string"
    );
}


// Private: extracts SQL text from a pg query argument.
function getQueryText(query: unknown): string | undefined {
    if (typeof query === "string") {
        return query;
    }

    if (hasTextProperty(query)) {
        return query.text;
    }

    return undefined;
}

// Private: identifies the schedule-conflict query.
function isScheduleConflictQuery(query: unknown): boolean {
    // 1. Extract the SQL query.
    // 2. Normalize whitespace.
    // 3. Check whether it contains the distinctive fragment
    //          JOIN events e ON e.id = b.event_id
    //      identifying the schedule-conflict query.
    return (
        getQueryText(query)
            ?.replace(/\s+/g, " ")
            .includes("JOIN events e ON e.id = b.event_id") ?? false
    );
}

// Public: pauses transactions after their schedule-conflict queries.
export function createConflictCheckBarrier(
    timeoutMs = CONFLICT_CHECK_TIMEOUT_MS,
): () => Promise<void> {
    let conflictCheckCount = 0;
    let releaseBarrier!: () => void;

    const bothConflictChecksCompleted = new Promise<void>(resolve => {
        releaseBarrier = resolve;
    });

    return async () => {
        conflictCheckCount++;

        if (conflictCheckCount === 2) {
            releaseBarrier();
        }

        await new Promise<void>(resolve => {
            const timeout = setTimeout(resolve, timeoutMs);

            bothConflictChecksCompleted.then(() => {
                clearTimeout(timeout);
                resolve();
            });
        });
    };
}

// Public: wraps a PostgreSQL client to synchronize conflict checks.
export function createSynchronizedClient(
    client: PoolClient,
    waitAtBarrier: () => Promise<void>,
): PoolClient {
    return new Proxy(client, {
        get(target, property) {
            if (property === "query") {
                return async (...args: unknown[]) => {
                    const result = await Reflect.apply(
                        target.query,
                        target,
                        args
                    );

                    if (isScheduleConflictQuery(args[0])) {
                        await waitAtBarrier();
                    }

                    return result;
                };
            }

            const value = Reflect.get(target, property, target);

            return typeof value === "function"
                ? value.bind(target)
                : value;
        },
    }) as PoolClient;
}
