import type { PoolClient } from "pg";

type QueryExecutor = {
    query: jest.Mock;
};

type TransactionDatabase = {
    transaction?: jest.Mock;
};

export const expectNthQuery = (
    queryExecutor: QueryExecutor,
    queryNumber: number,
    sqlFragment: string,
    params?: unknown[],
) => {
    expect(queryExecutor.query).toHaveBeenNthCalledWith(
        queryNumber,
        expect.stringContaining(sqlFragment),
        ...(params === undefined ? [] : [params]),
    );
};


export const mockTransaction = (
    db: TransactionDatabase,
    client: PoolClient,
) => {
    db.transaction = jest.fn(
        async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
            return callback(client);
        },
    );
};

