import type { PoolClient } from "pg";
import type { DatabaseService } from "../../../4. backend/src/database/database.service";

export interface InjectExpiredHoldOptions {
    db: DatabaseService;
    holdId: number;
}

export interface ExpiryInjectionState {
    expiryInjected: boolean;
}

export interface PauseTransactionAfterQueryOptions {
    matches: (query: string) => boolean;
}

export interface TransactionGate {
    matched: Promise<void>;
    release: () => void;
    restore: () => void;
}

export type InjectExpiredHoldCallback<T> = (
    client: PoolClient,
) => Promise<T>;

export type InjectExpiredHoldWithCallbackOptions<T> =
    InjectExpiredHoldOptions & {
        callback: InjectExpiredHoldCallback<T>;
    };
