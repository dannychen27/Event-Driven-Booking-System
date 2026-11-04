import type { DatabaseService } from "../../../4. backend/src/database/database.service";


export function getFulfilledResults<T>(results: PromiseSettledResult<T>[]): PromiseFulfilledResult<T>[] {
    return results.filter(
        (result): result is PromiseFulfilledResult<T> =>
            result.status === "fulfilled",
    );
}

export function getRejectedResults<T>(results: PromiseSettledResult<T>[]): PromiseRejectedResult[] {
    return results.filter(
        (result): result is PromiseRejectedResult =>
            result.status === "rejected",
    );
}

export function expectOneFulfilledAndOneRejected<T>(results: PromiseSettledResult<T>[]): PromiseRejectedResult {
    const fulfilled = getFulfilledResults(results);
    const rejected = getRejectedResults(results);

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    return rejected[0];
}

export async function expireHold(db: DatabaseService, hold_id: number): Promise<void> {
    await db.query(
        `
            UPDATE booking_holds
            SET
                created_at = statement_timestamp() - INTERVAL '2 minutes',
                expires_at = statement_timestamp() - INTERVAL '1 minute'
            WHERE id = $1;
        `,
        [hold_id],
    );
}
