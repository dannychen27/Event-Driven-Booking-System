import type { PoolClient } from "pg";
import type { InjectExpiredHoldOptions } from "../../types/bookingHoldTest.types";


function isStaleHoldCleanupQuery(query: unknown): boolean {
    const queryText = String(query);

    return (
        queryText.includes("UPDATE booking_holds")
        && queryText.includes("SET status = 'expired'")
    );
}

async function injectExpiredTimestamp(
    client: PoolClient,
    holdId: number,
): Promise<void> {
    await client.query(
        `
            UPDATE booking_holds
            SET created_at = statement_timestamp() - INTERVAL '2 minutes',
                expires_at = statement_timestamp() - INTERVAL '1 minute'
            WHERE id = $1;
        `,
        [holdId],
    );
}

function createClientWithExpiryInjection(
    client: PoolClient,
    holdId: number,
    state: { expiryInjected: boolean },
): PoolClient {
    return new Proxy(client, {
        get(target, property) {
            if (property === "query") {
                return async (...args: Parameters<PoolClient["query"]>) => {
                    const result = await Reflect.apply(target.query, target, args);

                    if (!state.expiryInjected && isStaleHoldCleanupQuery(args[0])) {
                        state.expiryInjected = true;
                        await injectExpiredTimestamp(target, holdId);
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


export async function injectExpiredHoldAfterStaleHoldCleanup<T>({
    db,
    holdId,
    callback,
}: InjectExpiredHoldOptions & {
    callback: (client: PoolClient) => Promise<T>;
}): Promise<T> {
    const originalTransaction = db.transaction.bind(db);
    const transactionSpy = jest.spyOn(db, "transaction");
    const state = { expiryInjected: false };

    transactionSpy.mockImplementation(
        async <R>(
            transactionCallback: (client: PoolClient) => Promise<R>,
        ): Promise<R> => {
            return originalTransaction(client =>
                transactionCallback(createClientWithExpiryInjection(client, holdId, state))
            );
        },
    );

    try {
        return await db.transaction(callback);
    } finally {
        transactionSpy.mockRestore();
    }
}
