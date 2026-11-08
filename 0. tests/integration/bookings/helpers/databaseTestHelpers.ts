import type { PoolClient } from "pg";
import type {
    ExpiryInjectionState,
    InjectExpiredHoldWithCallbackOptions,
    PauseTransactionAfterQueryOptions,
    TransactionGate,
} from "../../types/bookingHoldTest.types";
import type { DatabaseService } from "../../../../4. backend/src/database/database.service";


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

function createQueryInterceptingClient(
    client: PoolClient,
    afterQuery: (args: unknown[], result: unknown) => Promise<void>,
): PoolClient {
    return new Proxy(client, {
        get(target, property) {
            if (property !== "query") {
                const value = Reflect.get(target, property, target);
                return typeof value === "function"
                    ? value.bind(target)
                    : value;
            }

            return async (...args: unknown[]) => {
                const result = await Reflect.apply(target.query, target, args);
                await afterQuery(args, result);
                return result;
            };
        },
    }) as PoolClient;
}

function createClientWithExpiryInjection(
    client: PoolClient,
    holdId: number,
    state: ExpiryInjectionState,
): PoolClient {
    return createQueryInterceptingClient(
        client,
        async args => {
            if (!state.expiryInjected && isStaleHoldCleanupQuery(args[0])) {
                state.expiryInjected = true;
                await injectExpiredTimestamp(client, holdId);
            }
        },
    );
}


export async function injectExpiredHoldAfterStaleHoldCleanup<T>({
    db,
    holdId,
    callback,
}: InjectExpiredHoldWithCallbackOptions<T>): Promise<T> {
    const originalTransaction = db.transaction.bind(db);
    const transactionSpy = jest.spyOn(db, "transaction");
    const state = { expiryInjected: false };

    transactionSpy.mockImplementation(
        async <R>(transactionCallback: (client: PoolClient) => Promise<R>): Promise<R> => {
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

function interceptTransaction<T>(
    originalTransaction: DatabaseService["transaction"],
    callback: (client: PoolClient) => Promise<T>,
    options: PauseTransactionAfterQueryOptions,
    signalMatched: () => void,
    rejectMatched: (error: unknown) => void,
    release: Promise<void>,
    hasMatched: () => boolean,
): Promise<T> {
    return originalTransaction(async client => {
        const interceptedClient = createQueryInterceptingClient(
            client,
            async args => {
                if (!hasMatched() && options.matches(String(args[0]))) {
                    signalMatched();
                    await release;
                }
            },
        );

        return callback(interceptedClient);
    }).then(
        result => {
            if (!hasMatched()) {
                rejectMatched(new Error("Transaction completed without matching query"));
            }
            return result;
        },
        error => {
            if (!hasMatched()) {
                rejectMatched(error);
            }
            throw error;
        },
    );
}

export function pauseTransactionAfterQuery(
    db: DatabaseService,
    options: PauseTransactionAfterQueryOptions,
): TransactionGate {
    let signalMatched!: () => void;
    let rejectMatched!: (error: unknown) => void;
    let releaseTransaction!: () => void;
    let hasMatched = false;

    const matched = new Promise<void>((resolve, reject) => {
        signalMatched = () => {
            hasMatched = true;
            resolve();
        };
        rejectMatched = reject;
    });

    const transactionRelease = new Promise<void>(resolve => {
        releaseTransaction = resolve;
    });

    const originalTransaction = db.transaction.bind(db);
    const transactionSpy = jest.spyOn(db, "transaction");

    transactionSpy.mockImplementation(
        <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> =>
            interceptTransaction(
                originalTransaction,
                callback,
                options,
                signalMatched,
                rejectMatched,
                transactionRelease,
                () => hasMatched,
            ),
    );

    return {
        matched,
        release: releaseTransaction,
        restore: () => transactionSpy.mockRestore(),
    };
}
