export type ConcurrentRaceWinner = "cancellation" | "confirmation";

export type RaceOperation = Promise<unknown>;

export type LockWaitQueryResult = {
    count: number;
};
